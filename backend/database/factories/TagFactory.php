<?php

namespace Database\Factories;

use App\Models\Tag;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Tag>
 */
class TagFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'slug' => fake()->unique()->regexify('[a-z]{8,12}'),
            'name' => fake()->word(),
            'category' => '開発言語',
            'fetch_hour' => fake()->numberBetween(3, 8),
            'sort_order' => fake()->numberBetween(0, 100),
        ];
    }
}
