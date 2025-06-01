-- Delete all news posts
DELETE FROM public.news;
 
-- Reset the sequence if it exists
ALTER SEQUENCE IF EXISTS public.news_id_seq RESTART WITH 1; 