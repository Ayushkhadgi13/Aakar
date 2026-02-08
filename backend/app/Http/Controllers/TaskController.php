<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;
use App\Models\User;
use App\Models\Project; 
use Illuminate\Support\Facades\Auth;

class TaskController extends Controller
{
    // Get tasks for the logged-in user
    public function index(Request $request)
    {
        $user = $request->user();
        
        // If admin, show tasks they created AND tasks assigned to them
        if ($user->role === 'admin') {
            return response()->json([
                'my_tasks' => Task::with('creator')->where('assigned_to', $user->id)->orderBy('due_date')->get(),
                'assigned_by_me' => Task::with('assignee')->where('assigned_by', $user->id)->orderBy('created_at', 'desc')->get()
            ]);
        }

        // Regular users only see tasks assigned to them
        return response()->json([
            'my_tasks' => Task::with('creator')->where('assigned_to', $user->id)->orderBy('due_date')->get(),
            'assigned_by_me' => []
        ]);
    }

    // NEW: User Stats for Employee Dashboard
    public function userStats(Request $request) {
        $userId = $request->user()->id;

        return response()->json([
            'pending_count' => Task::where('assigned_to', $userId)->where('status', 'Pending')->count(),
            'in_progress_count' => Task::where('assigned_to', $userId)->where('status', 'In Progress')->count(),
            'completed_count' => Task::where('assigned_to', $userId)->where('status', 'Completed')->count(),
            'active_projects' => Project::where('status', 'In Progress')->count(),
            'recent_tasks' => Task::where('assigned_to', $userId)
                                  ->where('status', '!=', 'Completed')
                                  ->orderBy('due_date', 'asc')
                                  ->take(5)
                                  ->get()
        ]);
    }

    // Get list of users for dropdown (Admin only)
    public function getUsers(Request $request)
    {
        // Allow all users to see the list for tagging, or restrict to admin if preferred
        return response()->json(User::select('id', 'name', 'email', 'role')->get());
    }

    // Create a new task (Admin only)
    public function store(Request $request)
    {
        if ($request->user()->role !== 'admin') {
            return response()->json(['message' => 'Only admins can assign tasks.'], 403);
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assigned_to' => 'required|exists:users,id',
            'due_date' => 'required|date',
        ]);

        $task = Task::create([
            'title' => $data['title'],
            'description' => $data['description'],
            'assigned_to' => $data['assigned_to'],
            'assigned_by' => $request->user()->id,
            'due_date' => $data['due_date'],
            'status' => 'Pending'
        ]);

        return response()->json($task->load('assignee'));
    }

    // Update task status (Assignee or Admin)
    public function update(Request $request, $id)
    {
        $task = Task::findOrFail($id);
        
        // Allow assignee or creator (admin) to update status
        if ($request->user()->id !== $task->assigned_to && $request->user()->id !== $task->assigned_by) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'status' => 'required|in:Pending,In Progress,Completed'
        ]);

        $task->update(['status' => $data['status']]);

        return response()->json($task);
    }
}