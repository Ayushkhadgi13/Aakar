<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MaterialUsage;
use App\Models\VendorMaterial;
use App\Models\Project;
use Illuminate\Support\Facades\DB;

class MaterialController extends Controller
{
    /**
     * Log daily material usage for a project.
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logUsage(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'material_name' => 'required|string',
            'quantity_used' => 'required|numeric|min:0.01',
            'date' => 'required|date',
        ]);

        $usage = MaterialUsage::create([
            'project_id' => $validated['project_id'],
            'material_name' => $validated['material_name'],
            'quantity_used' => $validated['quantity_used'],
            'date' => $validated['date'],
            'logged_by' => $request->user()->id
        ]);

        return response()->json([
            'message' => 'Material usage logged successfully.',
            'data' => $usage
        ], 201);
    }

    /**
     * Calculate Inventory Status (Stock on Hand).
     * 
     * Logic: Total Purchased (from Vendors) - Total Used (from MaterialUsage)
     * Groups data by material name to provide a consolidated stock view.
     * 
     * @param int $projectId
     * @return \Illuminate\Http\JsonResponse
     */
    public function getInventoryStatus($projectId)
    {
        $project = Project::findOrFail($projectId);

        // 1. Get Total Purchased Quantity per Material
        // Efficiently sums up quantities via SQL Group By
        $purchased = VendorMaterial::whereHas('vendor', function ($q) use ($projectId) {
            $q->where('project_id', $projectId);
        })
        ->select('material_name', DB::raw('SUM(quantity) as total_purchased'))
        ->groupBy('material_name')
        ->get()
        ->keyBy('material_name');

        // 2. Get Total Consumed Quantity per Material
        $consumed = MaterialUsage::where('project_id', $projectId)
        ->select('material_name', DB::raw('SUM(quantity_used) as total_used'))
        ->groupBy('material_name')
        ->get()
        ->keyBy('material_name');

        // 3. Merge and Calculate Stock
        // Get all unique material names from both lists
        $allMaterials = $purchased->keys()->merge($consumed->keys())->unique()->values();

        $inventory = $allMaterials->map(function ($name) use ($purchased, $consumed) {
            $totalPurchased = (float) ($purchased[$name]->total_purchased ?? 0);
            $totalUsed = (float) ($consumed[$name]->total_used ?? 0);
            $currentStock = $totalPurchased - $totalUsed;

            return [
                'material_name' => $name,
                'total_purchased' => $totalPurchased,
                'total_used' => $totalUsed,
                'current_stock' => $currentStock,
                // Status indicator for frontend UI
                'status' => $currentStock <= 0 ? 'Out of Stock' : ($currentStock < ($totalPurchased * 0.2) ? 'Low Stock' : 'Good')
            ];
        });

        return response()->json([
            'project' => $project->name,
            'inventory' => $inventory
        ]);
    }
}