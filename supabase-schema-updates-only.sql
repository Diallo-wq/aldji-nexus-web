-- Script SQL pour ajouter uniquement la gestion des mises à jour
-- À exécuter dans l'éditeur SQL de Supabase

-- Table pour la gestion des mises à jour de l'application
CREATE TABLE IF NOT EXISTS public.updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  version_code INTEGER NOT NULL UNIQUE,
  version_name TEXT NOT NULL,
  mandatory BOOLEAN NOT NULL DEFAULT false,
  update_url TEXT NOT NULL,
  changelog TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index pour optimiser les requêtes de version
CREATE INDEX IF NOT EXISTS idx_updates_version_code ON public.updates(version_code DESC);

-- Vérifier si la fonction update_updated_at_column existe, sinon la créer
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $func$ language 'plpgsql';
  END IF;
END
$$;

-- Supprimer le trigger s'il existe déjà, puis le recréer
DROP TRIGGER IF EXISTS update_updates_updated_at ON public.updates;
CREATE TRIGGER update_updates_updated_at BEFORE UPDATE ON public.updates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS pour la table updates (lecture publique, écriture admin seulement)
ALTER TABLE public.updates ENABLE ROW LEVEL SECURITY;

-- Supprimer la politique si elle existe déjà, puis la recréer
DROP POLICY IF EXISTS "Anyone can view updates" ON public.updates;
CREATE POLICY "Anyone can view updates" ON public.updates
  FOR SELECT USING (true);

-- Insérer une version initiale (exemple) - ne pas insérer si elle existe déjà
INSERT INTO public.updates (version_code, version_name, mandatory, update_url, changelog)
VALUES (
  1,
  '1.0.0',
  false,
  'https://github.com/votre-repo/releases/download/v1.0.0/aldji-nexus-v1.0.0.apk',
  'Version initiale d''ALDJI-NEXUS avec gestion des produits, clients et ventes.'
) ON CONFLICT (version_code) DO NOTHING;

-- Message de confirmation
DO $$
BEGIN
  RAISE NOTICE 'Table updates créée avec succès. Système de mise à jour prêt.';
END
$$;
