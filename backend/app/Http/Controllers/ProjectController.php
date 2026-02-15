<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\ProjectUpdate;
use App\Models\ProjectDocument;
use App\Models\ProjectMaterialEstimate;
use App\Models\VendorMaterial;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class ProjectController extends Controller {
    
    public function index(Request $request) {
        $query = Project::query();

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

    public function show($id) {
        $project = Project::with(['updates.user', 'documents', 'estimates'])->findOrFail($id);
        return response()->json($project);
    }

    // New: Store Project Estimates (BOQ Setup)
    public function storeEstimate(Request $request, $id) {
        $request->validate([
            'material_name' => 'required|string',
            'estimated_quantity' => 'required|integer|min:1',
            'estimated_unit_price' => 'required|numeric|min:0',
            'unit' => 'required|string'
        ]);

        $estimate = ProjectMaterialEstimate::create([
            'project_id' => $id,
            'material_name' => $request->material_name,
            'estimated_quantity' => $request->estimated_quantity,
            'estimated_unit_price' => $request->estimated_unit_price,
            'unit' => $request->unit
        ]);

        return response()->json($estimate);
    }

    // New: Compare BOQ (Estimated vs Actual)
    public function getBOQAnalysis($id) {
        $project = Project::findOrFail($id);
        
        // 1. Get Estimates
        $estimates = ProjectMaterialEstimate::where('project_id', $id)->get();

        // 2. Get Actuals (grouped by material name)
        // We use the hasManyThrough relationship or manual query
        $actuals = VendorMaterial::whereHas('vendor', function($q) use ($id) {
            $q->where('project_id', $id);
        })
        ->select(
            'material_name', 
            DB::raw('SUM(quantity) as total_quantity'), 
            DB::raw('SUM(total_price) as total_cost'),
            DB::raw('AVG(unit_price) as avg_unit_price')
        )
        ->groupBy('material_name')
        ->get()
        ->keyBy('material_name'); // Key by name for easy lookup

        // 3. Merge Data for Comparison
        $analysis = $estimates->map(function($est) use ($actuals) {
            // Simple string matching (case-insensitive could be improved with LOWER())
            $actual = $actuals->get($est->material_name); 
            
            $estTotalCost = $est->estimated_quantity * $est->estimated_unit_price;
            $actQuantity = $actual ? $actual->total_quantity : 0;
            $actTotalCost = $actual ? $actual->total_cost : 0;

            return [
                'material' => $est->material_name,
                'unit' => $est->unit,
                // Estimated
                'est_qty' => $est->estimated_quantity,
                'est_rate' => $est->estimated_unit_price,
                'est_total' => $estTotalCost,
                // Actual
                'act_qty' => $actQuantity,
                'act_rate' => $actual ? round($actual->avg_unit_price, 2) : 0,
                'act_total' => $actTotalCost,
                // Variance
                'qty_variance' => $est->estimated_quantity - $actQuantity, // Positive means under-consumed (Good/Bad depending on context)
                'cost_variance' => $estTotalCost - $actTotalCost, // Positive means under budget
                'status' => ($actTotalCost > $estTotalCost) ? 'Over Budget' : 'Within Budget'
            ];
        });

        // Add actual items that were NOT in estimates (Unplanned expenses)
        foreach ($actuals as $name => $data) {
            if (!$estimates->contains('material_name', $name)) {
                $analysis->push([
                    'material' => $name,
                    'unit' => 'N/A', // Unit might be inconsistent if strictly grouped
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

    public function uploadDocument(Request $request, $id) {
        $request->validate([
            'file' => 'required|file|max:20480',
            'type' => 'required|string|in:BOQ,Drawing,Pre-Estimation,Other'
        ]);

        $file = $request->file('file');
        $path = $file->store('project_docs', 'public');

        $doc = ProjectDocument::create([
            'project_id' => $id,
            'file_type' => $request->type,
            'original_name' => $file->getClientOriginalName(),
            'file_path' => '/storage/' . $path
        ]);

        return response()->json($doc);
    }

    public function update(Request $request, $id) {
        $project = Project::findOrFail($id);
        $validated = $request->validate([
            'progress' => 'sometimes|integer|min:0|max:100',
            'status' => 'sometimes|in:Upcoming,In Progress,On Hold,Completed',
        ]);
        $project->update($validated);
        return response()->json($project);
    }

    public function addUpdate(Request $request, $id) {
        $request->validate([
            'message' => 'nullable|string',
            'image' => 'nullable|image|max:5120'
        ]);

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

    public function store(Request $request) {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:255',
                'client_name' => 'required|string|max:255',
                'location' => 'nullable|string|max:255',
                'budget' => 'required|numeric|min:0',
                'status' => 'required|in:Upcoming,In Progress,On Hold,Completed',
                'start_date' => 'required|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'progress' => 'required|integer|min:0|max:100'
            ]);

            $project = Project::create($data);
            return response()->json($project, 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Internal Server Error.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}