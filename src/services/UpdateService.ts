import { supabase } from './supabase';
import * as Application from 'expo-application';

export interface UpdateInfo {
  id: string;
  version_code: number;
  version_name: string;
  mandatory: boolean;
  update_url: string;
  changelog: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  updateInfo?: UpdateInfo;
  currentVersionCode: number;
}

class UpdateService {
  /**
   * Récupère le version code actuel de l'application
   */
  private async getCurrentVersionCode(): Promise<number> {
    try {
      // Sur Expo, on peut utiliser Application.nativeBuildVersion
      const buildVersion = Application.nativeBuildVersion;
      return buildVersion ? parseInt(buildVersion, 10) : 1;
    } catch (error) {
      console.warn('Impossible de récupérer le version code, utilisation de 1 par défaut:', error);
      return 1;
    }
  }

  /**
   * Vérifie s'il y a une mise à jour disponible
   */
  async checkForUpdate(): Promise<UpdateCheckResult> {
    try {
      const currentVersionCode = await this.getCurrentVersionCode();
      
      // Récupérer la dernière version depuis Supabase
      const { data: latestUpdate, error } = await supabase
        .from('updates')
        .select('*')
        .order('version_code', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Erreur lors de la vérification des mises à jour:', error);
        return {
          hasUpdate: false,
          currentVersionCode
        };
      }

      const hasUpdate = latestUpdate && latestUpdate.version_code > currentVersionCode;

      return {
        hasUpdate,
        updateInfo: hasUpdate ? latestUpdate : undefined,
        currentVersionCode
      };
    } catch (error) {
      console.error('Erreur lors de la vérification des mises à jour:', error);
      return {
        hasUpdate: false,
        currentVersionCode: await this.getCurrentVersionCode()
      };
    }
  }

  /**
   * Récupère toutes les mises à jour disponibles
   */
  async getAllUpdates(): Promise<UpdateInfo[]> {
    try {
      const { data: updates, error } = await supabase
        .from('updates')
        .select('*')
        .order('version_code', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des mises à jour:', error);
        return [];
      }

      return updates || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des mises à jour:', error);
      return [];
    }
  }

  /**
   * Ouvre l'URL de téléchargement de la mise à jour
   */
  async downloadUpdate(updateUrl: string): Promise<void> {
    try {
      const { Linking } = await import('react-native');
      const canOpen = await Linking.canOpenURL(updateUrl);
      
      if (canOpen) {
        await Linking.openURL(updateUrl);
      } else {
        throw new Error('Impossible d\'ouvrir l\'URL de mise à jour');
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture de l\'URL de mise à jour:', error);
      throw error;
    }
  }
}

export const updateService = new UpdateService();
