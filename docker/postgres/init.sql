-- Runs only when the db volume is created for the first time.
-- Separate database for automated tests (see backend/phpunit.xml).
CREATE DATABASE zennnews_test OWNER zennnews;
