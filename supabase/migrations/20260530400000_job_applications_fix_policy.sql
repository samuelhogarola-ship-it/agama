-- Remove overly broad authenticated access; anon insert is sufficient
-- for a public job application form with no admin UI yet.
revoke all on public.job_applications from authenticated;
drop policy if exists "authenticated_all_job_applications" on public.job_applications;
