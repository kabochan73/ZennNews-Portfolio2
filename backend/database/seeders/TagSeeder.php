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
     * - Up to 7 tags per hour, fetched once a day between 03:00 and 08:00
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
        ['go', 'Go', '開発言語', 3],
        // 04:00
        ['rust', 'Rust', '開発言語', 4],
        ['java', 'Java', '開発言語', 4],
        ['ruby', 'Ruby', '開発言語', 4],
        ['nodejs', 'Node.js', 'フレームワーク・ライブラリ', 4],
        ['laravel', 'Laravel', 'フレームワーク・ライブラリ', 4],
        ['nextjs', 'Next.js', 'フレームワーク・ライブラリ', 4],
        ['react', 'React', 'フレームワーク・ライブラリ', 4],
        // 05:00
        ['vue', 'Vue.js', 'フレームワーク・ライブラリ', 5],
        ['nuxt', 'Nuxt.js', 'フレームワーク・ライブラリ', 5],
        ['nestjs', 'NestJS', 'フレームワーク・ライブラリ', 5],
        ['rails', 'Rails', 'フレームワーク・ライブラリ', 5],
        ['aws', 'AWS', 'インフラ・クラウド', 5],
        ['gcp', 'Google Cloud', 'インフラ・クラウド', 5],
        ['azure', 'Azure', 'インフラ・クラウド', 5],
        // 06:00
        ['docker', 'Docker', 'インフラ・クラウド', 6],
        ['kubernetes', 'Kubernetes', 'インフラ・クラウド', 6],
        ['terraform', 'Terraform', 'インフラ・クラウド', 6],
        ['vercel', 'Vercel', 'インフラ・クラウド', 6],
        ['cloudflare', 'Cloudflare', 'インフラ・クラウド', 6],
        ['linux', 'Linux', 'インフラ・クラウド', 6],
        ['network', 'Network', 'インフラ・クラウド', 6],
        // 07:00
        ['db', 'DB', 'データベース', 7],
        ['sql', 'SQL', 'データベース', 7],
        ['claude', 'Claude', 'AI', 7],
        ['chatgpt', 'ChatGPT', 'AI', 7],
        ['gemini', 'Gemini', 'AI', 7],
        ['design', 'デザイン', 'デザイン', 7],
        ['ui', 'UI', 'デザイン', 7],
        // 08:00
        ['ux', 'UX', 'デザイン', 8],
        ['security', 'セキュリティ', 'その他', 8],
        ['git', 'Git', 'その他', 8],
        ['githubactions', 'GitHub Actions', 'その他', 8],
        ['test', 'テスト', 'その他', 8],
        ['algorithm', 'アルゴリズム', 'その他', 8],
        ['atcoder', 'AtCoder', 'その他', 8],
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
