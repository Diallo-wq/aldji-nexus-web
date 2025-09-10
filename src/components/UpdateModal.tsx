import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../utils/constants';
import { UpdateInfo } from '../services/UpdateService';
import { updateService } from '../services/UpdateService';

interface UpdateModalProps {
  visible: boolean;
  updateInfo: UpdateInfo;
  onClose?: () => void;
  onUpdateLater?: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  updateInfo,
  onClose,
  onUpdateLater,
}) => {
  const handleUpdate = async () => {
    try {
      await updateService.downloadUpdate(updateInfo.update_url);
    } catch (error) {
      Alert.alert(
        'Erreur',
        'Impossible d\'ouvrir le lien de téléchargement. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLater = () => {
    if (onUpdateLater) {
      onUpdateLater();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={updateInfo.mandatory ? undefined : onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons 
                name="download-outline" 
                size={48} 
                color={COLORS.primary} 
              />
            </View>
            <Text style={styles.title}>
              Nouvelle version disponible : v{updateInfo.version_name}
            </Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>Nouveautés :</Text>
            <Text style={styles.changelog}>
              {updateInfo.changelog || 'Améliorations et corrections de bugs.'}
            </Text>
            
            {updateInfo.mandatory && (
              <View style={styles.mandatoryNotice}>
                <Ionicons 
                  name="warning" 
                  size={20} 
                  color={COLORS.error} 
                  style={styles.warningIcon}
                />
                <Text style={styles.mandatoryText}>
                  Cette mise à jour est obligatoire pour continuer à utiliser l'application.
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.updateButton]}
              onPress={handleUpdate}
              activeOpacity={0.8}
            >
              <Text style={styles.updateButtonText}>Mettre à jour</Text>
            </TouchableOpacity>

            {!updateInfo.mandatory && (
              <TouchableOpacity
                style={[styles.button, styles.laterButton]}
                onPress={handleLater}
                activeOpacity={0.8}
              >
                <Text style={styles.laterButtonText}>Plus tard</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: BORDER_RADIUS.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      },
    }),
  },
  header: {
    alignItems: 'center',
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    color: COLORS.text,
    textAlign: 'center',
    lineHeight: 26,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    maxHeight: 200,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  changelog: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  mandatoryNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${COLORS.error}10`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.error,
    marginTop: SPACING.sm,
  },
  warningIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  mandatoryText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONTS.medium,
    color: COLORS.error,
    lineHeight: 18,
  },
  buttonContainer: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  updateButton: {
    backgroundColor: COLORS.primary,
  },
  updateButtonText: {
    fontSize: 16,
    fontFamily: FONTS.semiBold,
    color: '#ffffff',
  },
  laterButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  laterButtonText: {
    fontSize: 16,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
  },
});
