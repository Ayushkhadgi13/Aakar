<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;
use App\Models\User;
use App\Models\Project;
use Illuminate\Support\Facades\Auth;
use App\Notifications\TaskAssigned;
use App\Notifications\TaskCompleted;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        if ($user->role === 'admin') {
            return response()->json([
                'my_tasks' => Task::with('creator')->where('assigned_to', $user->id)->orderBy('due_date')->get(),
                'assigned_by_me' => Task::with('assignee')->where('assigned_by', $user->id)->orderBy('created_at', 'desc')->get()
            ]);
        }

        return response()->json([
            'my_tasks' => Task::with('creator')->where('assigned_to', $user->id)->orderBy('due_date')->get(),
            'assigned_by_me' => []
        ]);
    }

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

    public function getUsers(Request $request)
    {
        return response()->json(User::select('id', 'name', 'email', 'role')->get());
    }

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

        // Notify the assignee about their new task
        $assignee = User::find($data['assigned_to']);
        if ($assignee) {
            $assignee->notify(new TaskAssigned($task, $request->user()->name));
        }

        return response()->json($task->load('assignee'));
    }

    public function update(Request $request, $id)
    {
        $task = Task::findOrFail($id);

        if ($request->user()->id !== $task->assigned_to && $request->user()->id !== $task->assigned_by) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $data = $request->validate([
            'status' => 'required|in:Pending,In Progress,Completed'
        ]);

        $previousStatus = $task->status;
        $task->update(['status' => $data['status']]);

        // Notify the admin who assigned the task when it gets completed
        if ($data['status'] === 'Completed' && $previousStatus !== 'Completed') {
            $assigner = User::find($task->assigned_by);
            if ($assigner) {
                $assigner->notify(new TaskCompleted($task, $request->user()->name));
            }
        }

        return response()->json($task);
    }
}