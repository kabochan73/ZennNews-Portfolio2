<?php

namespace Database\Factories;

use App\Enums\ArticleType;
use App\Models\Article;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Article>
 */
class ArticleFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $username = fake()->regexify('[a-z]{6,10}');

        return [
            'zenn_id' => fake()->unique()->numberBetween(1, 999_999_999),
            'title' => fake()->sentence(),
            'emoji' => '📝',
            'article_type' => ArticleType::Tech,
            'path' => '/'.$username.'/articles/'.fake()->regexify('[a-z0-9]{14}'),
            'author_username' => $username,
            'author_name' => fake()->name(),
            'author_avatar_url' => fake()->imageUrl(),
            'published_at' => fake()->dateTimeBetween('-30 days'),
        ];
    }
}
