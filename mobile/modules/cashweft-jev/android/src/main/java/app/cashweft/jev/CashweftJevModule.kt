package app.cashweft.jev

import android.app.ActivityManager
import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class CashweftJevModule : Module() {
  @Volatile private var cancelled = false

  override fun definition() = ModuleDefinition {
    Name("CashweftJev")

    Function("isAvailable") { false }

    Function("getModelStatus") {
      mapOf(
        "available" to false,
        "state" to "rules",
        "bytes" to 0,
        "reason" to "phone pack not published",
      )
    }

    Function("deviceRamMb") {
      val manager = appContext.reactContext?.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
      val info = ActivityManager.MemoryInfo()
      manager?.getMemoryInfo(info)
      (info.totalMem / (1024 * 1024)).toInt()
    }

    AsyncFunction("downloadModel") {
      cancelled = false
      mapOf("accepted" to false, "reason" to "phone pack not published")
    }

    AsyncFunction("deleteModel") { true }

    AsyncFunction("warmup") { false }

    AsyncFunction("scoreHypotheses") { _: String, _: List<String> ->
      emptyList<Double>()
    }

    Function("cancel") {
      cancelled = true
      true
    }
  }
}
