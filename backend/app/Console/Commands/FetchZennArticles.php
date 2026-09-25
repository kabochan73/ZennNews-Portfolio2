<?php

namespace App\Console\Commands;

use App\Models\Tag;
use App\Services\ArticleImporter;
use App\Services\Zenn\ZennClient;
use Carbon\CarbonImmutable;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Sleep;
use Throwable;

#[Signature('zenn:fetch-articles
    {--tag=* : Fetch only these tags (Zenn topic names)}
    {--hour= : Fetch the tags assigned to this hour (3-8)}
    {--all : Fetch every tag}')]
#[Description('Fetch the latest Zenn articles for tags (default: tags assigned to the current JST hour)')]
class FetchZennArticles extends Command
{
    /**
     * Pause between tags so Zenn is not hit in a burst.
     */
    private const SECONDS_BETWEEN_TAGS = 1;

    /**
     * Execute the console command.
     */
    public function handle(ZennClient $client, ArticleImporter $importer): int
    {
        $tags = $this->resolveTags();

        if ($tags === null) {
            return self::FAILURE;
        }

        if ($tags->isEmpty()) {
            $this->info('No tags to fetch at this time.');

            return self::SUCCESS;
        }

        $failed = 0;

        foreach ($tags->values() as $index => $tag) {
            if ($index > 0) {
                Sleep::sleep(self::SECONDS_BETWEEN_TAGS);
            }

            try {
                $result = $importer->import($tag, $client->fetchLatestArticles($tag->slug));

                $this->info(sprintf(
                    '%s: 新規 %d件 / 100件から外れた %d件 / 削除 %d件',
                    $tag->slug,
                    $result['created'],
                    $result['unlinked'],
                    $result['deleted'],
                ));
            } catch (Throwable $e) {
                // Log it and move on; the tag is fetched again the next day.
                report($e);
                $this->error("{$tag->slug}: 取得に失敗しました（{$e->getMessage()}）");
                $failed++;
            }
        }

        return $failed === 0 ? self::SUCCESS : self::FAILURE;
    }

    /**
     * Decide which tags to fetch from the options.
     *
     * @return Collection<int, Tag>|null null when the options are invalid
     */
    private function resolveTags(): ?Collection
    {
        /** @var list<string> $slugs */
        $slugs = $this->option('tag');

        if ($slugs !== []) {
            $tags = Tag::whereIn('slug', $slugs)->orderBy('sort_order')->get();
            $unknown = array_diff($slugs, $tags->pluck('slug')->all());

            if ($unknown !== []) {
                $this->error('Unknown tag: '.implode(', ', $unknown));

                return null;
            }

            return $tags;
        }

        if ($this->option('all')) {
            return Tag::orderBy('sort_order')->get();
        }

        $hour = $this->option('hour') ?? CarbonImmutable::now('Asia/Tokyo')->hour;

        if (! is_numeric($hour)) {
            $this->error('--hour must be a number between 3 and 8.');

            return null;
        }

        return Tag::where('fetch_hour', (int) $hour)->orderBy('sort_order')->get();
    }
}
