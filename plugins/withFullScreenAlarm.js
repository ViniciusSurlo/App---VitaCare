const {
  withAndroidManifest,
  withDangerousMod,
  withPlugins,
  createRunOncePlugin,
} = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const FULL_SCREEN_INTENT_PERMISSION = 'android.permission.USE_FULL_SCREEN_INTENT';
const FULL_SCREEN_ACTIVITY_NAME = '.FullScreenAlarmActivity';
const PACKAGE_NAME = 'com.vitacare.alarm'; // Nome do pacote para o código nativo

/**
 * 1. Adiciona a permissão USE_FULL_SCREEN_INTENT ao AndroidManifest.xml
 */
const withFullScreenIntentPermission = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;

    // CORREÇÃO: Acessar o array de permissões de forma segura
    if (!androidManifest.manifest['uses-permission']) {
      androidManifest.manifest['uses-permission'] = [];
    }

    // Adiciona a permissão se ainda não existir
    if (
      !androidManifest.manifest['uses-permission'].some(
        (item) => item.$['android:name'] === FULL_SCREEN_INTENT_PERMISSION
      )
    ) {
      androidManifest.manifest['uses-permission'].push({
        $: {
          'android:name': FULL_SCREEN_INTENT_PERMISSION,
        },
      });
    }

    return config;
  });
};

/**
 * 2. Adiciona o FullScreenAlarmActivity ao AndroidManifest.xml
 */
const withFullScreenAlarmActivity = (config) => {
  return withAndroidManifest(config, (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Verifica se a Activity já existe para evitar duplicatas
    const activityExists = mainApplication.activity.some(
      (activity) => activity.$['android:name'] === FULL_SCREEN_ACTIVITY_NAME
    );

    if (!activityExists) {
      mainApplication.activity.push({
        $: {
          'android:name': FULL_SCREEN_ACTIVITY_NAME,
          'android:exported': 'true', // Necessário para ser chamado por notificação
          'android:showOnLockScreen': 'true', // Acorda a tela
          'android:showWhenLocked': 'true', // Acorda a tela
          'android:turnScreenOn': 'true', // Acorda a tela
          'android:launchMode': 'singleTop', // Garante que apenas uma instância exista
          'android:theme': '@style/Theme.App.SplashScreen', // Usa o tema do splash para tela cheia
        },
      });
    }

    return config;
  });
};

/**
 * 3. Cria o diretório e o código nativo da FullScreenAlarmActivity
 */
const withFullScreenAlarmNativeCode = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const root = config.modRequest.platformProjectRoot;
      const srcDir = path.join(root, 'app', 'src', 'main', 'java', ...PACKAGE_NAME.split('.'));
      const layoutDir = path.join(root, 'app', 'src', 'main', 'res', 'layout');

      // Cria o diretório do pacote se não existir
      await fs.promises.mkdir(srcDir, { recursive: true });
      await fs.promises.mkdir(layoutDir, { recursive: true });

      // --- Código Kotlin para FullScreenAlarmActivity.kt ---
      const activityCode = `package ${PACKAGE_NAME}

import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.facebook.react.ReactActivity
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactContext
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.vitacare.app.R // Assumindo que o R é do seu projeto Expo

class FullScreenAlarmActivity : AppCompatActivity() {

    companion object {
        const val EXTRA_MEDICATION_DATA = "medicationData"
        const val EVENT_ALARM_ACTION = "onAlarmAction"

        fun createIntent(context: Context, data: Bundle): Intent {
            return Intent(context, FullScreenAlarmActivity::class.java).apply {
                putExtra(EXTRA_MEDICATION_DATA, data)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Configurações para tela cheia e despertar
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            )
        }

        setContentView(R.layout.activity_full_screen_alarm)

        val data = intent.getBundleExtra(EXTRA_MEDICATION_DATA)
        val nome = data?.getString("nome") ?: "Medicamento"
        val dosagem = data?.getString("dosagem") ?: "Dose"
        val horario = data?.getString("horario") ?: "Agora"

        findViewById<TextView>(R.id.alarm_med_name).text = nome
        findViewById<TextView>(R.id.alarm_med_dosage).text = dosagem
        findViewById<TextView>(R.id.alarm_med_time).text = horario

        // Botão TOMAR
        findViewById<Button>(R.id.btn_tomar).setOnClickListener {
            sendActionToJS("tomar", data)
            finish() // Fecha a tela de alarme
        }

        // Botão ADIAR
        findViewById<Button>(R.id.btn_adiar).setOnClickListener {
            sendActionToJS("adiar", data)
            finish() // Fecha a tela de alarme
        }
    }

    /**
     * Envia a ação (tomar/adiar) e os dados do medicamento para o lado JS.
     */
    private fun sendActionToJS(action: String, data: Bundle?) {
        val reactContext = applicationContext as? ReactContext ?: return

        // Cria o payload para o JS
        val payload = Arguments.createMap().apply {
            putString("action", action)
            putMap("medicamento", Arguments.fromBundle(data))
        }

        // Envia o evento para o JS
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_ALARM_ACTION, payload)
    }
}
`;
      await fs.promises.writeFile(path.join(srcDir, 'FullScreenAlarmActivity.kt'), activityCode);

      // --- Código XML para activity_full_screen_alarm.xml ---
      const layoutCode = `<?xml version="1.0" encoding="utf-8"?>
<LinearLayout xmlns:android="http://schemas.android.com/apk/res/android"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:orientation="vertical"
    android:background="#000000"
    android:gravity="center"
    android:padding="32dp">

    <TextView
        android:id="@+id/alarm_title"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="HORA DO MEDICAMENTO"
        android:textColor="#FFFFFF"
        android:textSize="24sp"
        android:textStyle="bold"
        android:layout_marginBottom="40dp" />

    <TextView
        android:id="@+id/alarm_med_name"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Nome do Medicamento"
        android:textColor="#FFFFFF"
        android:textSize="36sp"
        android:textStyle="bold"
        android:layout_marginBottom="8dp" />

    <TextView
        android:id="@+id/alarm_med_dosage"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="Dosagem"
        android:textColor="#CCCCCC"
        android:textSize="20sp"
        android:layout_marginBottom="40dp" />

    <TextView
        android:id="@+id/alarm_med_time"
        android:layout_width="wrap_content"
        android:layout_height="wrap_content"
        android:text="00:00"
        android:textColor="#FFFFFF"
        android:textSize="64sp"
        android:textStyle="bold"
        android:layout_marginBottom="80dp" />

    <Button
        android:id="@+id/btn_tomar"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="TOMAR"
        android:backgroundTint="#4CAF50"
        android:textColor="#FFFFFF"
        android:textSize="24sp"
        android:padding="20dp"
        android:layout_marginBottom="16dp" />

    <Button
        android:id="@+id/btn_adiar"
        android:layout_width="match_parent"
        android:layout_height="wrap_content"
        android:text="ADIAR 5 MINUTOS"
        android:backgroundTint="#607D8B"
        android:textColor="#FFFFFF"
        android:textSize="24sp"
        android:padding="20dp" />

</LinearLayout>
`;
      await fs.promises.writeFile(path.join(layoutDir, 'activity_full_screen_alarm.xml'), layoutCode);

      return config;
    },
  ]);
};

/**
 * Plugin principal que combina as modificações.
 */
const withFullScreenAlarm = (config) => {
  config = withFullScreenIntentPermission(config);
  config = withFullScreenAlarmActivity(config);
  config = withFullScreenAlarmNativeCode(config);
  return config;
};

module.exports = createRunOncePlugin(withFullScreenAlarm, 'withFullScreenAlarm', '1.0.0');
