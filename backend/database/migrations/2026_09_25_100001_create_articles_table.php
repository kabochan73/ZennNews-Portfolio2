<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('articles', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('zenn_id')->unique();
            $table->string('title');
            $table->string('emoji', 16);
            $table->string('article_type', 10);
            $table->string('path');
            $table->string('author_username');
            $table->string('author_name');
            $table->text('author_avatar_url')->nullable();
            $table->timestampTz('published_at')->index();
            $table->timestampsTz();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('articles');
    }
};
