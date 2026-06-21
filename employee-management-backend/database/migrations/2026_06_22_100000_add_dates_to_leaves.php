<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leaves', function (Blueprint $table) {
            // Exact dates this leave covers (excludes already-booked days when applied around an existing leave).
            $table->json('dates')->nullable()->after('end_date');
            // True when applied around/within an existing leave (extra "add-on" days).
            $table->boolean('is_addon')->default(false)->after('dates');
        });
    }

    public function down(): void
    {
        Schema::table('leaves', fn (Blueprint $t) => $t->dropColumn(['dates', 'is_addon']));
    }
};
