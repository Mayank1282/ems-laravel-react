<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class EmployeeRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $employeeId = $this->route('employee')?->id;
        $userId = $this->route('employee')?->user_id;

        $emailRule = $this->isMethod('POST')
            ? ['required', 'email', 'unique:users,email']
            : ['sometimes', 'email', "unique:users,email,{$userId}"];

        $passwordRule = $this->isMethod('POST')
            ? ['required', 'string', Password::min(8)]
            : ['sometimes', 'string', Password::min(8)];

        return [
            'first_name'      => ['required', 'string', 'max:100'],
            'last_name'       => ['required', 'string', 'max:100'],
            'email'           => $emailRule,
            'password'        => $passwordRule,
            'department_id'   => ['nullable', 'exists:departments,id'],
            'phone'           => ['nullable', 'string', 'max:20'],
            'country_code'    => ['nullable', 'string', 'max:6'],
            'gender'          => ['nullable', 'in:male,female,other'],
            'date_of_birth'   => ['nullable', 'date', 'before:today'],
            'address'         => ['nullable', 'string', 'max:500'],
            'job_title'       => ['nullable', 'string', 'max:100'],
            'employment_type' => ['sometimes', 'in:full_time,part_time,contract'],
            'shift_start_time'       => ['nullable', 'date_format:H:i'],
            'shift_end_time'         => ['nullable', 'date_format:H:i'],
            'shift_required_minutes' => ['nullable', 'integer', 'min:1', 'max:1440'],
            'hire_date'       => ['required', 'date'],
            'salary'          => ['nullable', 'numeric', 'min:0'],
            'status'          => ['sometimes', 'in:active,inactive'],
            'role'            => ['sometimes', 'in:employee,hr'],
        ];
    }

    /** Expected local phone-number digit length(s) per country code. */
    public static function phoneLengths(): array
    {
        return [
            '+1' => [10], '+44' => [10], '+91' => [10], '+61' => [9], '+971' => [9],
            '+65' => [8], '+49' => [10, 11], '+33' => [9], '+81' => [10],
            '+86' => [11], '+92' => [10], '+880' => [10],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $code  = $this->input('country_code');
            $phone = $this->input('phone');
            if (!$phone || !$code) return;

            $digits = preg_replace('/\D/', '', $phone);
            $allowed = self::phoneLengths()[$code] ?? null;

            if ($allowed && !in_array(strlen($digits), $allowed, true)) {
                $expected = implode(' or ', $allowed);
                $validator->errors()->add('phone', "Phone number must be {$expected} digits for country code {$code}.");
            }
        });
    }
}
