
-- 1. Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'worker');

-- 2. Create user_roles table (roles MUST be separate per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create profiles table (no role stored here)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Security definer function to check roles (avoids infinite RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. RLS on user_roles: users can read own roles, admins can manage
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. RLS on profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Trigger: auto-create profile + worker role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'worker');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Add created_by column to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- 9. Drop ALL existing RLS policies on orders (they use RESTRICTIVE which blocks everything)
DROP POLICY IF EXISTS "Anyone can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can read orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can update orders" ON public.orders;

-- 10. New RLS policies for orders
CREATE POLICY "Users can view own orders or admin all"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR created_by = auth.uid()
  );

CREATE POLICY "Users can create orders"
  ON public.orders FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update orders"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete orders"
  ON public.orders FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 11. Drop existing RESTRICTIVE policies on order_files and replace
DROP POLICY IF EXISTS "Anyone can delete order files metadata" ON public.order_files;
DROP POLICY IF EXISTS "Anyone can insert order files metadata" ON public.order_files;
DROP POLICY IF EXISTS "Anyone can read order files metadata" ON public.order_files;

CREATE POLICY "Authenticated can read order_files"
  ON public.order_files FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can insert order_files"
  ON public.order_files FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can delete order_files"
  ON public.order_files FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 12. Drop existing RESTRICTIVE policies on component tables and replace with auth-based ones
-- We need to drop all restrictive policies and add permissive ones

-- series
DROP POLICY IF EXISTS "Anyone can delete series" ON public.series;
DROP POLICY IF EXISTS "Anyone can insert series" ON public.series;
DROP POLICY IF EXISTS "Anyone can read series" ON public.series;
DROP POLICY IF EXISTS "Anyone can update series" ON public.series;
CREATE POLICY "Authenticated can read series" ON public.series FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert series" ON public.series FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update series" ON public.series FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete series" ON public.series FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- fabrics
DROP POLICY IF EXISTS "Anyone can delete fabrics" ON public.fabrics;
DROP POLICY IF EXISTS "Anyone can insert fabrics" ON public.fabrics;
DROP POLICY IF EXISTS "Anyone can read fabrics" ON public.fabrics;
DROP POLICY IF EXISTS "Anyone can update fabrics" ON public.fabrics;
CREATE POLICY "Authenticated can read fabrics" ON public.fabrics FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert fabrics" ON public.fabrics FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update fabrics" ON public.fabrics FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete fabrics" ON public.fabrics FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- chests
DROP POLICY IF EXISTS "Anyone can delete chests" ON public.chests;
DROP POLICY IF EXISTS "Anyone can insert chests" ON public.chests;
DROP POLICY IF EXISTS "Anyone can read chests" ON public.chests;
DROP POLICY IF EXISTS "Anyone can update chests" ON public.chests;
CREATE POLICY "Authenticated can read chests" ON public.chests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert chests" ON public.chests FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update chests" ON public.chests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete chests" ON public.chests FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- automats
DROP POLICY IF EXISTS "Anyone can delete automats" ON public.automats;
DROP POLICY IF EXISTS "Anyone can insert automats" ON public.automats;
DROP POLICY IF EXISTS "Anyone can read automats" ON public.automats;
DROP POLICY IF EXISTS "Anyone can update automats" ON public.automats;
CREATE POLICY "Authenticated can read automats" ON public.automats FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert automats" ON public.automats FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update automats" ON public.automats FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete automats" ON public.automats FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- pillows
DROP POLICY IF EXISTS "Anyone can delete pillows" ON public.pillows;
DROP POLICY IF EXISTS "Anyone can insert pillows" ON public.pillows;
DROP POLICY IF EXISTS "Anyone can read pillows" ON public.pillows;
DROP POLICY IF EXISTS "Anyone can update pillows" ON public.pillows;
CREATE POLICY "Authenticated can read pillows" ON public.pillows FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert pillows" ON public.pillows FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update pillows" ON public.pillows FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete pillows" ON public.pillows FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- jaskis
DROP POLICY IF EXISTS "Anyone can delete jaskis" ON public.jaskis;
DROP POLICY IF EXISTS "Anyone can insert jaskis" ON public.jaskis;
DROP POLICY IF EXISTS "Anyone can read jaskis" ON public.jaskis;
DROP POLICY IF EXISTS "Anyone can update jaskis" ON public.jaskis;
CREATE POLICY "Authenticated can read jaskis" ON public.jaskis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert jaskis" ON public.jaskis FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update jaskis" ON public.jaskis FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete jaskis" ON public.jaskis FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- waleks
DROP POLICY IF EXISTS "Anyone can delete waleks" ON public.waleks;
DROP POLICY IF EXISTS "Anyone can insert waleks" ON public.waleks;
DROP POLICY IF EXISTS "Anyone can read waleks" ON public.waleks;
DROP POLICY IF EXISTS "Anyone can update waleks" ON public.waleks;
CREATE POLICY "Authenticated can read waleks" ON public.waleks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert waleks" ON public.waleks FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update waleks" ON public.waleks FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete waleks" ON public.waleks FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- finishes
DROP POLICY IF EXISTS "Anyone can delete finishes" ON public.finishes;
DROP POLICY IF EXISTS "Anyone can insert finishes" ON public.finishes;
DROP POLICY IF EXISTS "Anyone can read finishes" ON public.finishes;
DROP POLICY IF EXISTS "Anyone can update finishes" ON public.finishes;
CREATE POLICY "Authenticated can read finishes" ON public.finishes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert finishes" ON public.finishes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update finishes" ON public.finishes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete finishes" ON public.finishes FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- seats_sofa
DROP POLICY IF EXISTS "Anyone can delete seats_sofa" ON public.seats_sofa;
DROP POLICY IF EXISTS "Anyone can insert seats_sofa" ON public.seats_sofa;
DROP POLICY IF EXISTS "Anyone can read seats_sofa" ON public.seats_sofa;
DROP POLICY IF EXISTS "Anyone can update seats_sofa" ON public.seats_sofa;
CREATE POLICY "Authenticated can read seats_sofa" ON public.seats_sofa FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert seats_sofa" ON public.seats_sofa FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update seats_sofa" ON public.seats_sofa FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete seats_sofa" ON public.seats_sofa FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- seats_pufa
DROP POLICY IF EXISTS "Anyone can delete seats_pufa" ON public.seats_pufa;
DROP POLICY IF EXISTS "Anyone can insert seats_pufa" ON public.seats_pufa;
DROP POLICY IF EXISTS "Anyone can read seats_pufa" ON public.seats_pufa;
DROP POLICY IF EXISTS "Anyone can update seats_pufa" ON public.seats_pufa;
CREATE POLICY "Authenticated can read seats_pufa" ON public.seats_pufa FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert seats_pufa" ON public.seats_pufa FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update seats_pufa" ON public.seats_pufa FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete seats_pufa" ON public.seats_pufa FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- backrests
DROP POLICY IF EXISTS "Anyone can delete backrests" ON public.backrests;
DROP POLICY IF EXISTS "Anyone can insert backrests" ON public.backrests;
DROP POLICY IF EXISTS "Anyone can read backrests" ON public.backrests;
DROP POLICY IF EXISTS "Anyone can update backrests" ON public.backrests;
CREATE POLICY "Authenticated can read backrests" ON public.backrests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert backrests" ON public.backrests FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update backrests" ON public.backrests FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete backrests" ON public.backrests FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- sides
DROP POLICY IF EXISTS "Anyone can delete sides" ON public.sides;
DROP POLICY IF EXISTS "Anyone can insert sides" ON public.sides;
DROP POLICY IF EXISTS "Anyone can read sides" ON public.sides;
DROP POLICY IF EXISTS "Anyone can update sides" ON public.sides;
CREATE POLICY "Authenticated can read sides" ON public.sides FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert sides" ON public.sides FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update sides" ON public.sides FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete sides" ON public.sides FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- legs
DROP POLICY IF EXISTS "Anyone can delete legs" ON public.legs;
DROP POLICY IF EXISTS "Anyone can insert legs" ON public.legs;
DROP POLICY IF EXISTS "Anyone can read legs" ON public.legs;
DROP POLICY IF EXISTS "Anyone can update legs" ON public.legs;
CREATE POLICY "Authenticated can read legs" ON public.legs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert legs" ON public.legs FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update legs" ON public.legs FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete legs" ON public.legs FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- extras
DROP POLICY IF EXISTS "Anyone can delete extras" ON public.extras;
DROP POLICY IF EXISTS "Anyone can insert extras" ON public.extras;
DROP POLICY IF EXISTS "Anyone can read extras" ON public.extras;
DROP POLICY IF EXISTS "Anyone can update extras" ON public.extras;
CREATE POLICY "Authenticated can read extras" ON public.extras FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert extras" ON public.extras FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update extras" ON public.extras FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete extras" ON public.extras FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
