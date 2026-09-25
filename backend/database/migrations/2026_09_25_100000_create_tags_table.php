<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('tags', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 50)->unique();
            $table->string('name', 50);
            $table->string('category', 50);
            $table->smallInteger('fetch_hour');
            $table->integer('sort_order');
            $table->timestampsTz();
        });

        // Articles are fetched hourly from 03:00 to 08:00 JST.
        DB::statement('ALTER TABLE tags ADD CONSTRAINT tags_fetch_hour_check CHECK (fetch_hour BETWEEN 3 AND 8)');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tags');
    }
};
