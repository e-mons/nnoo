-- Migration: 20260922000000_storage_cleanup_triggers.sql
-- Description: Automated storage cleanup triggers to delete orphaned storage objects when businesses or expenses are deleted.

-- 1. Function to clean up all storage objects for a deleted business
CREATE OR REPLACE FUNCTION public.handle_business_storage_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  -- Delete all storage objects partitioned under businesses/<business_id>/
  DELETE FROM storage.objects
  WHERE (
    (storage.foldername(name))[1] = 'businesses' AND 
    (storage.foldername(name))[2] = OLD.id::text
  )
  OR name LIKE OLD.id::text || '/%';

  RETURN OLD;
END;
$$;

-- 2. Trigger on businesses table
DROP TRIGGER IF EXISTS trg_business_storage_cleanup ON public.businesses;
CREATE TRIGGER trg_business_storage_cleanup
  AFTER DELETE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_business_storage_cleanup();

-- 3. Function to clean up receipt storage object when an expense is deleted
CREATE OR REPLACE FUNCTION public.handle_expense_receipt_storage_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
  IF OLD.receipt_path IS NOT NULL AND OLD.receipt_path <> '' THEN
    DELETE FROM storage.objects
    WHERE bucket_id = 'expense-receipts'
      AND (name = OLD.receipt_path OR name LIKE '%/' || OLD.receipt_path);
  END IF;

  RETURN OLD;
END;
$$;

-- 4. Trigger on expenses table
DROP TRIGGER IF EXISTS trg_expense_receipt_storage_cleanup ON public.expenses;
CREATE TRIGGER trg_expense_receipt_storage_cleanup
  AFTER DELETE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_expense_receipt_storage_cleanup();
