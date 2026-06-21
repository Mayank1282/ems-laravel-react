<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class StaffMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user() || !$request->user()->isStaff()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Admin or HR access required.',
            ], 403);
        }

        return $next($request);
    }
}
