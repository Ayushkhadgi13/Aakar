<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\ProjectUpdate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

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

    // New: Get Single Project with Updates
    public function show($id) {
        $project = Project::with(['updates.user'])->findOrFail($id);
        return response()->json($project);
    }

    // New: Add Update (Text + Photo)
    public function addUpdate(Request $request, $id) {
        $request->validate([
            'message' => 'nullable|string',
            'image' => 'nullable|image|max:5120' // Max 5MB
        ]);

        // Ensure at least one is present
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

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation Failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error("Project Store Error: " . $e->getMessage());
            return response()->json([
                'message' => 'Internal Server Error.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}