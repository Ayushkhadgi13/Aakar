<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Assuming middleware handles auth, we allow the request to proceed to validation.
        return true; 
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name'        => ['required', 'string', 'max:255'],
            'client_name' => ['required', 'string', 'max:255'],
            'location'    => ['nullable', 'string', 'max:255'],
            'budget'      => ['required', 'numeric', 'min:0'],
            'status'      => ['required', 'in:Upcoming,In Progress,On Hold,Completed'],
            'start_date'  => ['required', 'date'],
            'end_date'    => ['nullable', 'date', 'after_or_equal:start_date'],
            'progress'    => ['required', 'integer', 'min:0', 'max:100'],
        ];
    }
}