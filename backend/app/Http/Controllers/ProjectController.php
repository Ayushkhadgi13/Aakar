<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\ProjectUpdate;
use App\Models\ProjectDocument;
use App\Models\ProjectMaterialEstimate;
use App\Models\VendorMaterial;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use App\Http\Requests\StoreProjectRequest;
use App\Notifications\BOQUploaded;
use App\Notifications\BOQReviewed;

class ProjectController extends Controller {
    
    public function index(Request $request) {
        $user = $request->user();
        if ($user->role === 'admin') {
            $query = Project::query();
        } else {
            $query = $user->projects(); 
        }

        if ($request->has('search') && $request->search != '') {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                  ->orWhere('client_name', 'like', "%$search%")
                  ->orWhere('location', 'like', "%$search%");
            });
        }
        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    public function show(Request $request, $id) {
        $user = $request->user();
        $project = Project::with(['updates.user', 'documents', 'estimates', 'users'])->findOrFail($id);

        if ($user->role !== 'admin' && !$project->users->contains($user->id)) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        return response()->json($project);
    }

    public function store(StoreProjectRequest $request) {
        $project = Project::create($request->validated());
        return response()->json($project, 201);
    }

    public function update(Request $request, $id) {
        $project = Project::findOrFail($id);
        $project->update($request->only(['name', 'client_name', 'location', 'budget', 'start_date', 'end_date', 'status', 'progress']));
        return response()->json($project);
    }

    public function destroy(Request $request, $id) {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        Project::findOrFail($id)->delete();
        return response()->json(['message' => 'Project deleted']);
    }

    public function assignUsers(Request $request, $id) {
        $project = Project::findOrFail($id);
        $project->users()->sync($request->user_ids);
        return response()->json(['message' => 'Team updated', 'users' => $project->users]);
    }

    public function storeEstimates(Request $request, $id) {
        $validated = $request->validate([
            'material_name' => 'required|string',
            'estimated_quantity' => 'required|numeric|min:0',
            'estimated_unit_price' => 'required|numeric|min:0',
            'unit' => 'required|string',
        ]);
        $estimate = ProjectMaterialEstimate::create(array_merge($validated, ['project_id' => $id]));
        return response()->json($estimate, 201);
    }

    public function getBOQAnalysis($id) {
        $project = Project::findOrFail($id);
        $estimates = ProjectMaterialEstimate::where('project_id', $id)->get();

        $actuals = VendorMaterial::whereHas('vendor', function ($q) use ($id) {
            $q->where('project_id', $id);
        })
        ->select('material_name',
            DB::raw('SUM(quantity) as total_quantity'),
            DB::raw('SUM(total_price) as total_cost'),
            DB::raw('AVG(unit_price) as avg_unit_price')
        )
        ->groupBy('material_name')
        ->get()
        ->keyBy('material_name');

        $analysis = $estimates->map(function ($est) use ($actuals) {
            $actual = $actuals->get($est->material_name);
            $actQuantity = $actual ? (float)$actual->total_quantity : 0;
            $actTotalCost = $actual ? (float)$actual->total_cost : 0;
            $estTotalCost = (float)$est->estimated_quantity * (float)$est->estimated_unit_price;

            return [
                'material' => $est->material_name,
                'unit' => $est->unit,
                'est_qty' => $est->estimated_quantity,
                'est_rate' => $est->estimated_unit_price,
                'est_total' => $estTotalCost,
                'act_qty' => $actQuantity,
                'act_rate' => $actual ? round($actual->avg_unit_price, 2) : 0,
                'act_total' => $actTotalCost,
                'qty_variance' => $est->estimated_quantity - $actQuantity,
                'cost_variance' => $estTotalCost - $actTotalCost,
                'status' => ($actTotalCost > $estTotalCost) ? 'Over Budget' : 'Within Budget'
            ];
        });

        foreach ($actuals as $name => $data) {
            if (!$estimates->contains('material_name', $name)) {
                $analysis->push([
                    'material' => $name, 'unit' => 'N/A',
                    'est_qty' => 0, 'est_rate' => 0, 'est_total' => 0,
                    'act_qty' => $data->total_quantity,
                    'act_rate' => round($data->avg_unit_price, 2),
                    'act_total' => $data->total_cost,
                    'qty_variance' => 0 - $data->total_quantity,
                    'cost_variance' => 0 - $data->total_cost,
                    'status' => 'Unplanned'
                ]);
            }
        }

        return response()->json([
            'project_name' => $project->name,
            'boq_data' => $analysis,
            'total_estimated_budget' => $analysis->sum('est_total'),
            'total_actual_cost' => $analysis->sum('act_total')
        ]);
    }

    public function getFinancialVariance($id) {
        $project = Project::findOrFail($id);
        $estimates = ProjectMaterialEstimate::where('project_id', $id)
            ->select('material_name', DB::raw('SUM(estimated_quantity * estimated_unit_price) as total_estimated'))
            ->groupBy('material_name')->get()->keyBy('material_name');

        $actuals = VendorMaterial::whereHas('vendor', function($q) use ($id) {
            $q->where('project_id', $id);
        })->select('material_name', DB::raw('SUM(total_price) as total_actual'))
        ->groupBy('material_name')->get()->keyBy('material_name');

        $estimatedTotal = $estimates->sum('total_estimated');
        $actualTotal = $actuals->sum('total_actual');
        $varianceAmount = $estimatedTotal - $actualTotal;

        $allMaterials = $estimates->keys()->merge($actuals->keys())->unique()->values();
        $breakdown = $allMaterials->map(function ($material) use ($estimates, $actuals) {
            $estCost = (float) ($estimates->has($material) ? $estimates->get($material)->total_estimated : 0);
            $actCost = (float) ($actuals->has($material) ? $actuals->get($material)->total_actual : 0);
            return [
                'material_name' => $material,
                'estimated_cost' => $estCost,
                'actual_cost' => $actCost,
                'variance' => $estCost - $actCost,
                'status' => ($actCost > $estCost) ? 'Over Estimate' : 'Under Estimate'
            ];
        });

        return response()->json([
            'project_id' => $project->id, 'project_name' => $project->name,
            'estimated_total' => (float) $estimatedTotal, 'actual_total' => (float) $actualTotal,
            'variance_amount' => (float) $varianceAmount, 'is_over_budget' => $varianceAmount < 0,
            'breakdown' => $breakdown
        ]);
    }

    public function uploadDocument(Request $request, $id) {
        $request->validate([
            'file' => 'required|file|max:20480',
            'type' => 'required|string|in:BOQ,Drawing,Pre-Estimation,Other'
        ]);

        $file = $request->file('file');
        $path = $file->store('project_docs', 'public');
        $status = $request->type === 'BOQ' ? 'pending' : 'approved';

        $doc = ProjectDocument::create([
            'project_id' => $id,
            'file_type' => $request->type,
            'original_name' => $file->getClientOriginalName(),
            'file_path' => '/storage/' . $path,
            'status' => $status,
        ]);

        // Notify all admins when a BOQ file is uploaded for review
        if ($request->type === 'BOQ') {
            $admins = User::where('role', 'admin')->get();
            Notification::send($admins, new BOQUploaded($doc, $request->user()->name));
        }

        return response()->json($doc);
    }

    /**
     * Admin approves a BOQ document — notifies all project team members.
     */
    public function approveDocument(Request $request, $id) {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $doc = ProjectDocument::findOrFail($id);
        $doc->update(['status' => 'approved']);

        // Notify all team members on this project
        $project = Project::with('users')->findOrFail($doc->project_id);
        Notification::send($project->users, new BOQReviewed($doc, 'approved'));

        return response()->json(['message' => 'Document approved.', 'document' => $doc]);
    }

    /**
     * Admin rejects a BOQ document — notifies all project team members.
     */
    public function rejectDocument(Request $request, $id) {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $doc = ProjectDocument::findOrFail($id);
        $doc->update(['status' => 'rejected']);

        // Notify all team members on this project
        $project = Project::with('users')->findOrFail($doc->project_id);
        Notification::send($project->users, new BOQReviewed($doc, 'rejected'));

        return response()->json(['message' => 'Document rejected.', 'document' => $doc]);
    }

    /**
     * Any team member (or admin) can delete a rejected BOQ document.
     */
    public function deleteDocument(Request $request, $id) {
        $doc = ProjectDocument::findOrFail($id);
        $user = $request->user();

        if ($doc->status !== 'rejected') {
            return response()->json(['message' => 'Only rejected documents can be deleted.'], 422);
        }

        if ($user->role !== 'admin') {
            $isMember = $user->projects()->where('projects.id', $doc->project_id)->exists();
            if (!$isMember) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
        }

        $storagePath = str_replace('/storage/', '', $doc->file_path);
        Storage::disk('public')->delete($storagePath);
        $doc->delete();

        return response()->json(['message' => 'Document deleted.']);
    }

    public function addUpdate(Request $request, $id) {
        $request->validate(['message' => 'nullable|string', 'image' => 'nullable|image|max:5120']);
        if (!$request->message && !$request->hasFile('image')) {
            return response()->json(['message' => 'Please provide text or an image'], 422);
        }
        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('project_updates', 'public');
        }
        $update = ProjectUpdate::create([
            'project_id' => $id,
            'user_id' => $request->user()->id,
            'message' => $request->message,
            'image_path' => $imagePath ? '/storage/' . $imagePath : null
        ]);
        return response()->json($update->load('user'));
    }
}