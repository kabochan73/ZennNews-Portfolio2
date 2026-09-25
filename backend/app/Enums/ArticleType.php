<?php

namespace App\Enums;

/**
 * Zenn article types ("article_type" in the Zenn API).
 */
enum ArticleType: string
{
    case Tech = 'tech';
    case Idea = 'idea';
}
