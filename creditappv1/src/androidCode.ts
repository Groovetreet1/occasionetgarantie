/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AndroidFileStructure } from './types';

export const androidFiles: AndroidFileStructure[] = [
  {
    name: "Architectural Overview",
    path: "docs/ARCHITECTURE.md",
    language: "kotlin",
    description: "Structure globale recommandée pour l'application Android native 'Maîtresse des Crédits MAD'.",
    code: `# Architecture Globale (Clean Architecture avec MVVM)

Voici la structure de dossiers recommandée pour le projet Android natif :

\`\`\`text
com.mad.credits/
│
├── data/                         # Couche Données (Database, API, Repositories)
│   ├── local/
│   │   ├── CreditDatabase.kt     # Base de données Room
│   │   ├── CreditDao.kt          # Requêtes SQL d'accès
│   │   └── CreditEntity.kt       # Modèle de table Room
│   └── repository/
│       └── CreditRepository.kt   # Source de vérité unique pour les VMs
│
├── domain/                       # Couche Métier (Cas d'utilisation et modèles métier)
│   ├── model/
│   │   └── Credit.kt             # Objet métier propre
│   └── usecase/
│       ├── AddCreditUseCase.kt
│       ├── DeleteCreditUseCase.kt
│       └── GetCreditsUseCase.kt
│
├── ui/                           # Couche Présentation (Jetpack Compose & ViewModels)
│   ├── dashboard/
│   │   ├── DashboardScreen.kt    # Écran d'accueil principal (Material 3)
│   │   └── DashboardViewModel.kt # Gestionnaire d'état de l'écran principal
│   ├── add_credit/
│   │   ├── AddCreditScreen.kt    # Écran de formulaire d'ajout
│   │   └── AddCreditViewModel.kt # Gestionnaire d'état du formulaire
│   └── theme/
│       ├── Color.kt              # Thème Royal Blue & Emerald Green (M3)
│       ├── Theme.kt              # Configuration MaterialTheme (Dark/Light)
│       └── Type.kt               # Configuration de la typographie
│
└── worker/                       # Service d'arrière-plan pour les rappels d'échéances
    ├── ReminderScheduler.kt      # Configuration AlarmManager / WorkManager
    └── CreditReminderWorker.kt   # Dispatcher de notifications push locales
\`\`\``
  },
  {
    name: "CreditEntity.kt (Room)",
    path: "data/local/CreditEntity.kt",
    language: "kotlin",
    description: "Modèle de persistance locale Room pour stocker les détails de chaque crédit.",
    code: `package com.mad.credits.data.local

import androidx.room.Entity
import androidx.room.PrimaryKey
import java.util.Date

@Entity(tableName = "credits")
data class CreditEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val nom: String,
    val prenom: String,
    val montant: Double, // Explicite en MAD
    val type: String,    // "DETTE" ou "PRET"
    val dateCreation: Long, // Horodatage UNIX (Date par défaut : aujourd'hui)
    val dateEcheance: Long, // Horodatage limite de remboursement
    val description: String = "",
    val isPaye: Boolean = false
)
`
  },
  {
    name: "CreditDao.kt (Room Access)",
    path: "data/local/CreditDao.kt",
    language: "kotlin",
    description: "Interface DAO définissant les requêtes SQLite d'accès aux crédits de l'application.",
    code: `package com.mad.credits.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface CreditDao {
    @Query("SELECT * FROM credits ORDER BY dateEcheance ASC")
    fun getAllCreditsFlow(): Flow<List<CreditEntity>>

    @Query("SELECT * FROM credits WHERE id = :id")
    suspend fun getCreditById(id: Long): CreditEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertCredit(credit: CreditEntity): Long

    @Delete
    suspend fun deleteCredit(credit: CreditEntity)

    @Update
    suspend fun updateCredit(credit: CreditEntity)

    @Query("SELECT SUM(montant) FROM credits WHERE isPaye = 0 AND type = 'DETTE'")
    fun getTotalDettesFlow(): Flow<Double?>

    @Query("SELECT SUM(montant) FROM credits WHERE isPaye = 0 AND type = 'PRET'")
    fun getTotalPretsFlow(): Flow<Double?>
}
`
  },
  {
    name: "CreditDatabase.kt",
    path: "data/local/CreditDatabase.kt",
    language: "kotlin",
    description: "Point d'accès de base de données SQLite géré par Room.",
    code: `package com.mad.credits.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(entities = [CreditEntity::class], version = 1, exportSchema = false)
abstract class CreditDatabase : RoomDatabase() {
    abstract val creditDao: CreditDao

    companion object {
        @Volatile
        private var INSTANCE: CreditDatabase? = null

        fun getDatabase(context: Context): CreditDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    CreditDatabase::class.java,
                    "credits_database"
                ).build()
                INSTANCE = instance
                instance
            }
        }
    }
}
`
  },
  {
    name: "DashboardScreen.kt (Compose)",
    path: "ui/dashboard/DashboardScreen.kt",
    language: "kotlin",
    description: "Écran d'accueil principal en Jetpack Compose affichant le total des crédits en MAD, le graphique et la liste interactive.",
    code: `package com.mad.credits.ui.dashboard

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel,
    onNavigateToAddCredit: () -> Unit
) {
    val state by viewModel.state.collectAsState()
    val dateFormat = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())

    // Couleurs du Thème : Bleu Nuit Émeraude (MAD)
    val startColor = Color(0xFF0F172A) // Night Blue
    val endColor = Color(0xFF047857)   // Emerald Green

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Maîtresse des Crédits MAD", fontWeight = FontWeight.Bold) },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF0F172A),
                    titleContentColor = Color.White
                )
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onNavigateToAddCredit,
                containerColor = Color(0xFF059669), // Emerald Accent
                contentColor = Color.White
            ) {
                Icon(Icons.Default.Add, contentDescription = "Ajouter un crédit")
            }
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .background(Color(0xFFF8FAFC)) // Soft Slate Light Background
        ) {
            // Bannière du Tableau de Bord avec Dégradé Financier de Confiance
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(
                        brush = Brush.horizontalGradient(colors = listOf(startColor, endColor)),
                        shape = RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp)
                    )
                    .padding(24.dp)
            ) {
                Column {
                    Text(
                        text = "Montant Total Actif",
                        color = Color.White.copy(alpha = 0.7f),
                        fontSize = 14.sp
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "\${state.totalCreditsAmount} MAD", // Dynamique
                        color = Color.White,
                        fontSize = 32.sp,
                        fontWeight = FontWeight.Black
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    // Indicateur de Ratio (Dettes reçues / Prêts donnés)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text("À Rembourser (Dettes)", color = Color.White.copy(0.6f), fontSize = 11.sp)
                            Text("\${state.totalDettes} MAD", color = Color(0xFFFDA4AF), fontWeight = FontWeight.SemiBold) // Soft Red
                        }
                        Column(horizontalAlignment = Alignment.End) {
                            Text("À Récupérer (Prêts)", color = Color.White.copy(0.6f), fontSize = 11.sp)
                            Text("\${state.totalPrets} MAD", color = Color(0xFF6EE7B7), fontWeight = FontWeight.SemiBold) // Soft Emerald
                        }
                    }
                }
            }

            // Section Liste & Tri
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Vos Échéances Actives",
                    fontWeight = FontWeight.Bold,
                    fontSize = 18.sp,
                    color = Color(0xFF1E293B)
                )
                // Bouton de Tri simulé
                TextButton(onClick = { viewModel.toggleSortOrder() }) {
                    Text("Trier par Échéance")
                }
            }

            // Liste de crédits avec Swipe to Dismiss
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(bottom = 80.dp)
            ) {
                items(state.credits, key = { it.id }) { credit ->
                    // Composant pour l'effet SwipeToDismiss
                    CreditItemRow(
                        credit = credit,
                        onDelete = { viewModel.deleteCredit(credit) },
                        onTogglePaye = { viewModel.togglePayeStatus(credit) },
                        dateFormat = dateFormat
                    )
                }
            }
        }
    }
}
`
  },
  {
    name: "AddCreditScreen.kt (Formulaire)",
    path: "ui/add_credit/AddCreditScreen.kt",
    language: "kotlin",
    description: "Écran de formulaire d'ajout d'une dette ou d'un prêt avec sélection de dates Material 3.",
    code: `package com.mad.credits.ui.add_credit

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddCreditScreen(
    viewModel: AddCreditViewModel,
    onBack: () -> Unit
) {
    var nom by remember { mutableStateOf("") }
    var prenom by remember { mutableStateOf("") }
    var montant by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var creditType by remember { mutableStateOf("DETTE") } // DETTE ou PRET

    var showDatePickerCreation by remember { mutableStateOf(false) }
    var showDatePickerEcheance by remember { mutableStateOf(false) }

    val dateCreationState = rememberDatePickerState(
        initialSelectedDateMillis = System.currentTimeMillis()
    )
    val dateEcheanceState = rememberDatePickerState()

    val dateFormat = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Nouveau Crédit MAD") },
                navigationIcon = {
                    TextButton(onClick = onBack) { Text("Retour") }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Type de transaction (Dette ou Prêt)
            Text("Je souhaite enregistrer :", fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Spacer(modifier = Modifier.height(8.dp))
            Row(modifier = Modifier.fillMaxWidth()) {
                ElevatedFilterChip(
                    selected = creditType == "DETTE",
                    onClick = { creditType = "DETTE" },
                    label = { Text("Une Dette (Je dois)") },
                    modifier = Modifier.weight(1f)
                )
                Spacer(modifier = Modifier.width(8.dp))
                ElevatedFilterChip(
                    selected = creditType == "PRET",
                    onClick = { creditType = "PRET" },
                    label = { Text("Un Prêt (On me doit)") },
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Coordonnées de la personne
            OutlinedTextField(
                value = prenom,
                onValueChange = { prenom = it },
                label = { Text("Prénom") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )
            Spacer(modifier = Modifier.height(12.dp))
            OutlinedTextField(
                value = nom,
                onValueChange = { nom = it },
                label = { Text("Nom") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Montant expressément en MAD
            OutlinedTextField(
                value = montant,
                onValueChange = { montant = it },
                label = { Text("Montant (MAD)") },
                placeholder = { Text("0.00") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Date de Création (Par défaut aujourd'hui)
            val creationDateString = dateCreationState.selectedDateMillis?.let {
                dateFormat.format(Date(it))
            } ?: dateFormat.format(Date())
            
            OutlinedButton(
                onClick = { showDatePickerCreation = true },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Date de création : $creationDateString")
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Date d'Échéance (Date Limite)
            val echeanceDateString = dateEcheanceState.selectedDateMillis?.let {
                dateFormat.format(Date(it))
            } ?: "Sélectionner la date limite..."
            
            OutlinedButton(
                onClick = { showDatePickerEcheance = true },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Date d'échéance : $echeanceDateString")
            }

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Notes optionnelles") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Validation du formulaire de crédit et ordonnancement automatique de la notification
            Button(
                onClick = {
                    if (nom.isNotBlank() && montant.isNotBlank() && dateEcheanceState.selectedDateMillis != null) {
                        viewModel.addCredit(
                            nom = nom,
                            prenom = prenom,
                            montant = montant.toDoubleOrNull() ?: 0.0,
                            type = creditType,
                            dateCreation = dateCreationState.selectedDateMillis ?: System.currentTimeMillis(),
                            dateEcheance = dateEcheanceState.selectedDateMillis!!,
                            description = description
                        )
                        onBack()
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF047857))
            ) {
                Text("Enregistrer le Crédit", fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
        }

        // Dialogs pour le sélecteur de dates (DatePickers)
        if (showDatePickerCreation) {
            DatePickerDialog(
                onDismissRequest = { showDatePickerCreation = false },
                confirmButton = {
                    TextButton(onClick = { showDatePickerCreation = false }) { Text("Confirmer") }
                }
            ) {
                DatePicker(state = dateCreationState)
            }
        }

        if (showDatePickerEcheance) {
            DatePickerDialog(
                onDismissRequest = { showDatePickerEcheance = false },
                confirmButton = {
                    TextButton(onClick = { showDatePickerEcheance = false }) { Text("Confirmer") }
                }
            ) {
                DatePicker(state = dateEcheanceState)
            }
        }
    }
}
`
  },
  {
    name: "ReminderScheduler.kt (Alarme)",
    path: "worker/ReminderScheduler.kt",
    language: "kotlin",
    description: "Système de planification d'alarmes Android locales (48h avant et le jour J) avec AlarmManager.",
    code: `package com.mad.credits.worker

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build

object ReminderScheduler {

    /**
     * Planifie des notifications : 48h avant l'échéance, et le matin du Jour J.
     */
    fun scheduleAlarmsForCredit(context: Context, creditId: Long, dateEcheanceMillis: Long, prenomNom: String, montant: Double) {
        val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return

        val now = System.currentTimeMillis()

        // 1. Alarme Jour J (ex: à 09:00 le jour de l'échéance)
        val calendarJourJ = Calendar.getInstance().apply {
            timeInMillis = dateEcheanceMillis
            set(Calendar.HOUR_OF_DAY, 9)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
        }
        val triggerTimeJourJ = calendarJourJ.timeInMillis
        if (triggerTimeJourJ > now) {
            val intent = createIntent(context, creditId, "JOUR_J", prenomNom, montant)
            setAlarm(alarmManager, triggerTimeJourJ, intent)
        }

        // 2. Alarme 48h avant l'échéance (Jour J - 2)
        val triggerTime48h = dateEcheanceMillis - (2 * 24 * 60 * 60 * 1000)
        if (triggerTime48h > now) {
            val intent = createIntent(context, creditId, "PRE_48H", prenomNom, montant)
            setAlarm(alarmManager, triggerTime48h, intent)
        }
    }

    private fun createIntent(context: Context, creditId: Long, alertType: String, label: String, valAmount: Double): PendingIntent {
        val intent = Intent(context, CreditReminderReceiver::class.java).apply {
            putExtra("CREDIT_ID", creditId)
            putExtra("ALERT_TYPE", alertType) // "JOUR_J" ou "PRE_48H"
            putExtra("LABEL", label)
            putExtra("AMOUNT", valAmount)
        }
        
        // requestCode unique par alarme pour éviter le remplacement d'un rappel par un autre
        val requestCode = (creditId.toString() + alertType).hashCode()

        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION.SDK_INT) {
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        } else {
            PendingIntent.FLAG_UPDATE_CURRENT
        }
        return PendingIntent.getBroadcast(context, requestCode, intent, flags)
    }

    private fun setAlarm(alarmManager: AlarmManager, triggerTime: Long, pendingIntent: PendingIntent) {
        if (Build.VERSION.SDK_INT >= Build.VERSION.SDK_INT) {
            // Nécessite la permission SCHEDULE_EXACT_ALARM pour Android 12+
            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
        } else {
            alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent)
        }
    }
}
`
  },
  {
    name: "CreditReminderReceiver.kt",
    path: "worker/CreditReminderReceiver.kt",
    language: "kotlin",
    description: "BroadcastReceiver recevant l'alarme et affichant la notification push locale Android.",
    code: `package com.mad.credits.worker

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.mad.credits.R

class CreditReminderReceiver : BroadcastReceiver() {

    private val CHANNEL_ID = "credits_reminder_channel"

    override fun onReceive(context: Context, intent: Intent) {
        val creditId = intent.getLongExtra("CREDIT_ID", -1)
        val alertType = intent.getStringExtra("ALERT_TYPE") ?: "JOUR_J"
        val label = intent.getStringExtra("LABEL") ?: "Client"
        val amount = intent.getDoubleExtra("AMOUNT", 0.0)

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        // Créer le canal sur Android 8+
        if (Build.VERSION.SDK_INT >= Build.VERSION.SDK_INT) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Rappels d'échéances crédits",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Notifie l'utilisateur 48h avant et le Jour J de l'échéance."
            }
            notificationManager.createNotificationChannel(channel)
        }

        // Composer le titre et message personnalisé
        val title = if (alertType == "JOUR_J") {
            "🔴 Échéance aujourd'hui !"
        } else {
            "⏰ Échéance dans 48 heures !"
        }

        val message = if (alertType == "JOUR_J") {
            "Le crédit de $amount MAD pour $label est arrivé à sa date limite de remboursement."
        } else {
            "Rappel : Le crédit de $amount MAD accordé à/par $label arrive à échéance très bientôt."
        }

        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher) // Remplacement par l'icône de l'app
            .setContentTitle(title)
            .setContentText(message)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)

        val notificationId = (creditId.toString() + alertType).hashCode()
        notificationManager.notify(notificationId, builder.build())
    }
}
`
  }
];
