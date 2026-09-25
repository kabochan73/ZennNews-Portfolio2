<?php

namespace Database\Seeders;

use App\Models\Tag;
use Illuminate\Database\Seeder;

class TagSeeder extends Seeder
{
    /**
     * Tags fetched from Zenn: [slug, display name, category, fetch hour (JST)].
     *
     * - slug is the Zenn topic name used for the API's "topicname" parameter
     * - Up to 6 tags per hour, fetched once a day between 03:00 and 08:00
     * - Array order is the display order on the tag selection screen
     *
     * @var list<array{0: string, 1: string, 2: string, 3: int}>
     */
    private const TAGS = [
        // 03:00
        ['typescript', 'TypeScript', '開発言語', 3],
        ['javascript', 'JavaScript', '開発言語', 3],
        ['html', 'HTML', '開発言語', 3],
        ['css', 'CSS', '開発言語', 3],
        ['php', 'PHP', '開発言語', 3],
        ['python', 'Python', '開発言語', 3],
        // 04:00
        ['go', 'Go', '開発言語', 4],
        ['rust', 'Rust', '開発言語', 4],
        ['java', 'Java', '開発言語', 4],
        ['ruby', 'Ruby', '開発言語', 4],
        ['laravel', 'Laravel', 'フレームワーク・ライブラリ', 4],
        ['nextjs', 'Next.js', 'フレームワーク・ライブラリ', 4],
        // 05:00
        ['react', 'React', 'フレームワーク・ライブラリ', 5],
        ['vue', 'Vue.js', 'フレームワーク・ライブラリ', 5],
        ['nuxt', 'Nuxt.js', 'フレームワーク・ライブラリ', 5],
        ['nestjs', 'NestJS', 'フレームワーク・ライブラリ', 5],
        ['rails', 'Rails', 'フレームワーク・ライブラリ', 5],
        ['flutter', 'Flutter', 'フレームワーク・ライブラリ', 5],
        // 06:00
        ['aws', 'AWS', 'インフラ・クラウド', 6],
        ['gcp', 'Google Cloud', 'インフラ・クラウド', 6],
        ['azure', 'Azure', 'インフラ・クラウド', 6],
        ['docker', 'Docker', 'インフラ・クラウド', 6],
        ['kubernetes', 'Kubernetes', 'インフラ・クラウド', 6],
        ['terraform', 'Terraform', 'インフラ・クラウド', 6],
        // 07:00
        ['vercel', 'Vercel', 'インフラ・クラウド', 7],
        ['cloudflare', 'Cloudflare', 'インフラ・クラウド', 7],
        ['postgresql', 'PostgreSQL', 'データベース', 7],
        ['mysql', 'MySQL', 'データベース', 7],
        ['sqlite', 'SQLite', 'データベース', 7],
        ['claude', 'Claude', 'その他', 7],
        // 08:00
        ['security', 'セキュリティ', 'その他', 8],
        ['git', 'Git', 'その他', 8],
        ['githubactions', 'GitHub Actions', 'その他', 8],
        ['test', 'テスト', 'その他', 8],
        ['キャリア', 'キャリア', 'その他', 8],
    ];

    /**
     * Seed the tags.
     *
     * Upserts by slug, so re-running keeps existing tag IDs (and users' favorites).
     */
    public function run(): void
    {
        $rows = [];

        foreach (self::TAGS as $index => [$slug, $name, $category, $fetchHour]) {
            $rows[] = [
                'slug' => $slug,
                'name' => $name,
                'category' => $category,
                'fetch_hour' => $fetchHour,
                'sort_order' => $index,
            ];
        }

        Tag::upsert($rows, uniqueBy: ['slug'], update: ['name', 'category', 'fetch_hour', 'sort_order']);
    }
}
