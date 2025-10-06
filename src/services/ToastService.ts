import {Alert} from 'react-native';
import {Toast} from 'react-native-toast-notifications';

type ToastType = 'success' | 'error' | 'custom_toast';

class AlertServiceClass {
  toastPrompt = (
    msg: string,
    msg1?: string,
    type: ToastType = 'success',
  ): void => {
    if (type === 'error') {
      Toast.show(msg, {
        duration: 2000,
        type: 'danger',
        placement: 'bottom',
      });
    } else {
      Toast.show(msg, {
        type: 'success',
        placement: 'bottom',
        duration: 4000,
        animationType: 'zoom-in',
      });
    }
  };

  show(title: string, message: string): void {
    Alert.alert(title, message, [
      {
        text: 'OK',
        style: 'destructive',
      },
    ]);
  }

  deleteAlert(): Promise<boolean> {
    return new Promise(resolve => {
      Alert.alert('Delete', 'Are you sure you want to delete?', [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            resolve(true);
          },
        },
      ]);
    });
  }

  confirm(
    message: string,
    okText?: string,
    cancelText?: string,
    title?: string,
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      Alert.alert(
        title || '',
        message,
        [
          {
            text: cancelText || 'Cancel',
            onPress: () => reject(),
            style: 'cancel',
          },
          {
            text: okText || 'OK',
            onPress: () => resolve(true),
          },
        ],
        {cancelable: false},
      );
    });
  }
}

const AlertService = new AlertServiceClass();
export default AlertService;
