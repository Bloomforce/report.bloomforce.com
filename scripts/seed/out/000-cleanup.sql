delete from public.comp_observations where source in ('survey','public_record','apify_hiringcafe');
delete from public.survey_responses where source = 'survey';
delete from public.job_classification;
delete from public.raw_jobs where source = 'apify_hiringcafe';
delete from public.benchmark_published;
delete from public.sentiment_published;
delete from public.pulse_published;
delete from public.demand_published;
delete from public.freshness_published;