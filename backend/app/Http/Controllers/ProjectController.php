<?php

namespace App\Http\Controllers;

use App\Events\ProjectUpdatePosted;
use App\Http\Requests\StoreProjectRequest;
use App\Jobs\ParseBOQDocument;
use App\Models\MaterialUsage;
use App\Models\Project;
use App\Models\ProjectDocument;
use App\Models\ProjectMaterialEstimate;
use App\Models\ProjectUpdate;
use App\Models\User;
use App\Models\VendorMaterial;
use App\Notifications\BOQReviewed;
use App\Notifications\BOQUploaded;
use App\Notifications\ProjectAssigned;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $query = $user->role === 'admin'
            ? Project::query()
            : $user->projects();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('client_name', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%");
            });
        }

        return response()->json(
            $query
                ->with(['users:id,name,role'])
                ->orderByDesc('created_at')
                ->get()
        );
    }

    public function show(Request $request, $id)
    {
        $project = Project::with([
            'updates.user',
            'documents' => fn ($query) => $query->orderByDesc('version')->orderByDesc('created_at'),
            'documents.versions',
            'estimates',
            'users:id,name,email,role',
        ])->findOrFail($id);

        if (!$this->canAccessProject($request->user(), $project)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($project);
    }

    public function store(StoreProjectRequest $request)
    {
        $project = Project::create($request->validated());

        return response()->json($project, 201);
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);
        $project->update($request->only([
            'name',
            'client_name',
            'location',
            'budget',
            'start_date',
            'end_date',
            'status',
            'progress',
        ]));

        return response()->json($project);
    }

    public function destroy(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        Project::findOrFail($id)->delete();

        return response()->json(['message' => 'Project deleted']);
    }

    public function assignUsers(Request $request, $id)
    {
        $project = Project::with('users')->findOrFail($id);
        $validated = $request->validate([
            'user_ids' => 'required|array',
            'user_ids.*' => 'exists:users,id',
        ]);

        $existingIds = $project->users->pluck('id');
        $incomingIds = collect($validated['user_ids'])->map(fn ($value) => (int) $value);
        $newIds = $incomingIds->diff($existingIds);

        $project->users()->sync($incomingIds->all());
        $project->load('users');

        if ($newIds->isNotEmpty()) {
            $newUsers = User::whereIn('id', $newIds)->get();
            Notification::send($newUsers, new ProjectAssigned($project, $request->user()->name));
        }

        return response()->json([
            'message' => 'Team updated',
            'users' => $project->users,
        ]);
    }

    public function getMembers(Request $request, $id)
    {
        $project = Project::with('users:id,name,email,role')->findOrFail($id);

        if (!$this->canAccessProject($request->user(), $project)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($project->users);
    }

    public function addMembers(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Only admins can add project members.'], 403);
        }

        $project = Project::with('users')->findOrFail($id);
        $validated = $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'exists:users,id',
        ]);

        $existingIds = $project->users->pluck('id');
        $incomingIds = collect($validated['user_ids'])->map(fn ($value) => (int) $value);
        $newIds = $incomingIds->diff($existingIds);

        $project->users()->syncWithoutDetaching($incomingIds->all());
        $project->load('users');

        if ($newIds->isNotEmpty()) {
            $users = User::whereIn('id', $newIds)->get();
            Notification::send($users, new ProjectAssigned($project, $request->user()->name));
        }

        return response()->json([
            'message' => 'Members added successfully.',
            'users' => $project->users,
        ]);
    }

    public function removeMember(Request $request, $id, $userId)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Only admins can remove project members.'], 403);
        }

        $project = Project::findOrFail($id);
        $project->users()->detach($userId);

        return response()->json(['message' => 'Member removed successfully.']);
    }

    public function storeEstimates(Request $request, $id)
    {
        $validated = $request->validate([
            'material_name' => 'required|string',
            'estimated_quantity' => 'required|numeric|min:0',
            'estimated_unit_price' => 'required|numeric|min:0',
            'unit' => 'required|string',
        ]);

        $estimate = ProjectMaterialEstimate::create(array_merge($validated, [
            'project_id' => $id,
        ]));

        return response()->json($estimate, 201);
    }

    public function getBOQAnalysis($id)
    {
        $project = Project::findOrFail($id);
        $estimates = ProjectMaterialEstimate::where('project_id', $id)->get();

        $actuals = VendorMaterial::whereHas('vendor', function ($query) use ($id) {
            $query->where('project_id', $id);
        })
            ->select(
                'material_name',
                DB::raw('SUM(quantity) as total_quantity'),
                DB::raw('SUM(total_price) as total_cost'),
                DB::raw('AVG(unit_price) as avg_unit_price')
            )
            ->groupBy('material_name')
            ->get()
            ->keyBy('material_name');

        $analysis = $estimates->map(function ($estimate) use ($actuals) {
            $actual = $actuals->get($estimate->material_name);
            $actualQuantity = $actual ? (float) $actual->total_quantity : 0;
            $actualTotalCost = $actual ? (float) $actual->total_cost : 0;
            $estimatedTotalCost = (float) $estimate->estimated_quantity * (float) $estimate->estimated_unit_price;

            return [
                'material' => $estimate->material_name,
                'unit' => $estimate->unit,
                'est_qty' => $estimate->estimated_quantity,
                'est_rate' => $estimate->estimated_unit_price,
                'est_total' => $estimatedTotalCost,
                'act_qty' => $actualQuantity,
                'act_rate' => $actual ? round($actual->avg_unit_price, 2) : 0,
                'act_total' => $actualTotalCost,
                'qty_variance' => $estimate->estimated_quantity - $actualQuantity,
                'cost_variance' => $estimatedTotalCost - $actualTotalCost,
                'status' => $actualTotalCost > $estimatedTotalCost ? 'Over Budget' : 'Within Budget',
            ];
        });

        foreach ($actuals as $name => $data) {
            if (!$estimates->contains('material_name', $name)) {
                $analysis->push([
                    'material' => $name,
                    'unit' => 'N/A',
                    'est_qty' => 0,
                    'est_rate' => 0,
                    'est_total' => 0,
                    'act_qty' => (float) $data->total_quantity,
                    'act_rate' => round((float) $data->avg_unit_price, 2),
                    'act_total' => (float) $data->total_cost,
                    'qty_variance' => 0 - (float) $data->total_quantity,
                    'cost_variance' => 0 - (float) $data->total_cost,
                    'status' => 'Unplanned',
                ]);
            }
        }

        return response()->json([
            'project_name' => $project->name,
            'boq_data' => $analysis->values(),
            'total_estimated_budget' => $analysis->sum('est_total'),
            'total_actual_cost' => $analysis->sum('act_total'),
        ]);
    }

    public function getMaterialComparison(Request $request, $id)
    {
        $project = Project::with('users:id')->findOrFail($id);

        if (!$this->canAccessProject($request->user(), $project)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $estimated = ProjectMaterialEstimate::where('project_id', $id)
            ->get()
            ->groupBy(fn ($estimate) => $this->normalizeMaterialName($estimate->material_name));

        $actual = MaterialUsage::where('project_id', $id)
            ->get()
            ->groupBy(fn ($usage) => $this->normalizeMaterialName($usage->material_name));

        $allKeys = $estimated->keys()->merge($actual->keys())->unique()->values();

        $comparison = $allKeys->map(function ($key) use ($estimated, $actual) {
            $estimatedRows = $estimated->get($key, collect());
            $actualRows = $actual->get($key, collect());

            $estimatedQuantity = (float) $estimatedRows->sum('estimated_quantity');
            $actualQuantity = (float) $actualRows->sum('quantity_used');
            $estimatedCost = (float) $estimatedRows->sum(function ($row) {
                return (float) $row->estimated_quantity * (float) $row->estimated_unit_price;
            });

            $label = $estimatedRows->first()->material_name
                ?? $actualRows->first()->material_name
                ?? $key;

            return [
                'material_name' => $label,
                'estimated_quantity' => $estimatedQuantity,
                'actual_quantity' => $actualQuantity,
                'quantity_variance' => $actualQuantity - $estimatedQuantity,
                'estimated_cost' => $estimatedCost,
                'status' => $actualQuantity > $estimatedQuantity
                    ? 'Overused'
                    : ($actualQuantity === 0 && $estimatedQuantity > 0 ? 'Unused' : 'On Track'),
            ];
        })->sortBy('material_name')->values();

        return response()->json([
            'project_id' => $project->id,
            'project_name' => $project->name,
            'summary' => [
                'estimated_quantity' => $comparison->sum('estimated_quantity'),
                'actual_quantity' => $comparison->sum('actual_quantity'),
                'variance_quantity' => $comparison->sum('quantity_variance'),
            ],
            'materials' => $comparison,
        ]);
    }

    public function getFinancialVariance($id)
    {
        $project = Project::findOrFail($id);
        $estimates = ProjectMaterialEstimate::where('project_id', $id)
            ->select('material_name', DB::raw('SUM(estimated_quantity * estimated_unit_price) as total_estimated'))
            ->groupBy('material_name')
            ->get()
            ->keyBy('material_name');

        $actuals = VendorMaterial::whereHas('vendor', function ($query) use ($id) {
            $query->where('project_id', $id);
        })
            ->select('material_name', DB::raw('SUM(total_price) as total_actual'))
            ->groupBy('material_name')
            ->get()
            ->keyBy('material_name');

        $estimatedTotal = (float) $estimates->sum('total_estimated');
        $actualTotal = (float) $actuals->sum('total_actual');
        $varianceAmount = $estimatedTotal - $actualTotal;

        $allMaterials = $estimates->keys()->merge($actuals->keys())->unique()->values();
        $breakdown = $allMaterials->map(function ($material) use ($estimates, $actuals) {
            $estimatedCost = (float) ($estimates->get($material)->total_estimated ?? 0);
            $actualCost = (float) ($actuals->get($material)->total_actual ?? 0);

            return [
                'material_name' => $material,
                'estimated_cost' => $estimatedCost,
                'actual_cost' => $actualCost,
                'variance' => $estimatedCost - $actualCost,
                'status' => $actualCost > $estimatedCost ? 'Over Estimate' : 'Under Estimate',
            ];
        });

        return response()->json([
            'project_id' => $project->id,
            'project_name' => $project->name,
            'estimated_total' => $estimatedTotal,
            'actual_total' => $actualTotal,
            'variance_amount' => $varianceAmount,
            'is_over_budget' => $varianceAmount < 0,
            'breakdown' => $breakdown,
        ]);
    }

    public function uploadDocument(Request $request, $id)
    {
        $request->validate([
            'file' => 'required|file|max:20480',
            'type' => 'required|string|in:BOQ,Drawing,Pre-Estimation,Other',
        ]);

        $project = Project::findOrFail($id);
        $file = $request->file('file');
        $path = $file->store('project_docs', 'public');
        $latestDocument = ProjectDocument::where('project_id', $id)
            ->where('file_type', $request->type)
            ->orderByDesc('version')
            ->first();

        $parentDocumentId = $latestDocument?->parent_document_id ?: $latestDocument?->id;
        $nextVersion = ($latestDocument?->version ?? 0) + 1;
        $status = $request->type === 'BOQ' ? 'pending' : 'approved';
        $parsedStatus = $request->type === 'BOQ' ? 'pending' : 'not_applicable';

        $document = ProjectDocument::create([
            'project_id' => $project->id,
            'file_type' => $request->type,
            'original_name' => $file->getClientOriginalName(),
            'file_path' => '/storage/' . $path,
            'status' => $status,
            'parsed_status' => $parsedStatus,
            'version' => $nextVersion,
            'parent_document_id' => $parentDocumentId,
        ]);

        if ($request->type === 'BOQ') {
            $admins = User::where('role', 'admin')->get();
            Notification::send($admins, new BOQUploaded($document, $request->user()->name));
            ParseBOQDocument::dispatch($document->id);
        }

        return response()->json($document->fresh());
    }

    public function approveDocument(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $document = ProjectDocument::findOrFail($id);
        $document->update(['status' => 'approved']);

        $project = Project::with('users')->findOrFail($document->project_id);
        Notification::send($project->users, new BOQReviewed($document, 'approved'));

        return response()->json([
            'message' => 'Document approved.',
            'document' => $document,
        ]);
    }

    public function rejectDocument(Request $request, $id)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $document = ProjectDocument::findOrFail($id);
        $document->update(['status' => 'rejected']);

        $project = Project::with('users')->findOrFail($document->project_id);
        Notification::send($project->users, new BOQReviewed($document, 'rejected'));

        return response()->json([
            'message' => 'Document rejected.',
            'document' => $document,
        ]);
    }

    public function deleteDocument(Request $request, $id)
    {
        $document = ProjectDocument::findOrFail($id);
        $user = $request->user();

        if ($document->status !== 'rejected') {
            return response()->json(['message' => 'Only rejected documents can be deleted.'], 422);
        }

        if ($user->role !== 'admin' && !$user->projects()->where('projects.id', $document->project_id)->exists()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $storagePath = str_replace('/storage/', '', $document->file_path);
        Storage::disk('public')->delete($storagePath);
        $document->delete();

        return response()->json(['message' => 'Document deleted.']);
    }

    public function addUpdate(Request $request, $id)
    {
        $request->validate([
            'message' => 'nullable|string',
            'image' => 'nullable|image|max:5120',
        ]);

        if (!$request->message && !$request->hasFile('image')) {
            return response()->json(['message' => 'Please provide text or an image'], 422);
        }

        $imagePath = $request->hasFile('image')
            ? $request->file('image')->store('project_updates', 'public')
            : null;

        $update = ProjectUpdate::create([
            'project_id' => $id,
            'user_id' => $request->user()->id,
            'message' => $request->message,
            'image_path' => $imagePath ? '/storage/' . $imagePath : null,
        ]);

        broadcast(new ProjectUpdatePosted($update))->toOthers();

        return response()->json($update->load('user'));
    }

    protected function canAccessProject(User $user, Project $project): bool
    {
        return $user->role === 'admin' || $project->users->contains($user->id);
    }

    protected function normalizeMaterialName(string $name): string
    {
        return strtolower(trim(preg_replace('/\s+/', ' ', $name)));
    }
}
