
CREATE OR REPLACE FUNCTION public.sync_default_finish()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.allowed_finishes IS NOT NULL AND array_length(NEW.allowed_finishes, 1) = 1 THEN
    NEW.default_finish := NEW.allowed_finishes[1];
  END IF;
  RETURN NEW;
END;
$function$;
