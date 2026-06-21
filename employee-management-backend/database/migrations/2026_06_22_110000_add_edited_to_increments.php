<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('increments', function (Blueprint $table) {
            $table->boolean('edited')->default(false)->after('arrears_paid'); // HR may correct an increment once
        });
    }

    public function down(): void
    {
        Schema::table('increments', fn (Blueprint $t) => $t->dropColumn('edited'));
    }
};
