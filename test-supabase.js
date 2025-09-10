// Script de test pour vérifier la connexion Supabase
// Exécuter avec: node test-supabase.js

const { createClient } = require('@supabase/supabase-js');

// Configuration temporaire pour les tests
const supabaseUrl = 'https://znfrixnupnnufkudggdk.supabase.co';
const supabaseKey = 'YOUR_ANON_KEY_HERE'; // Remplacez par votre vraie clé

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🚀 Test de connexion à Supabase...\n');
    
    // Test 1: Vérifier la connexion
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact' });
    
    if (error) {
      console.error('❌ Erreur de connexion:', error.message);
      return;
    }
    
    console.log('✅ Connexion réussie à Supabase !');
    console.log(`📊 Tables disponibles : ${data ? 'users trouvée' : 'aucune donnée'}\n`);
    
    // Test 2: Vérifier l'authentification
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('⚠️  Pas de session active (normal)');
    } else {
      console.log('✅ Service d\'authentification disponible');
    }
    
    console.log('\n🎉 Configuration Supabase OK !');
    console.log('\n📋 Prochaines étapes :');
    console.log('1. Remplacer YOUR_ANON_KEY_HERE par votre vraie clé');
    console.log('2. Exécuter le script SQL dans Supabase');
    console.log('3. Tester l\'application avec npm start');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testConnection();
