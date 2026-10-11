package app.cashweft.sms

import android.Manifest
import android.content.ContentResolver
import android.content.pm.PackageManager
import android.net.Uri
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class CashweftSmsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("CashweftSms")

    AsyncFunction("listMessages") { senders: List<String>, since: Double ->
      val page = readPage(senders, since.toLong(), Long.MAX_VALUE / 4, null, null, 400)
      page.messages.map { message ->
        mapOf("sender" to message.sender, "body" to message.body, "receivedAt" to message.receivedAt)
      }
    }

    AsyncFunction("listMessagesPage") { options: Map<String, Any?> ->
      val senders = stringList(options["senders"])
      val since = longValue(options["since"]) ?: 0L
      val until = longValue(options["until"]) ?: Long.MAX_VALUE / 4
      val beforeDate = longValue(options["beforeDate"])
      val beforeId = longValue(options["beforeId"])
      val limit = (longValue(options["limit"]) ?: 400L).toInt().coerceIn(1, 500)
      val page = readPage(senders, since, until, beforeDate, beforeId, limit)
      mapOf(
        "examined" to page.examined,
        "messages" to page.messages.map { message ->
          mapOf(
            "id" to message.id,
            "sender" to message.sender,
            "body" to message.body,
            "receivedAt" to message.receivedAt,
          )
        },
        "next" to page.next?.let { mapOf("date" to it.date, "id" to it.id) },
      )
    }

    AsyncFunction("discoverFinancialSenders") { options: Map<String, Any?> ->
      val since = longValue(options["since"]) ?: 0L
      val until = longValue(options["until"]) ?: Long.MAX_VALUE / 4
      val beforeDate = longValue(options["beforeDate"])
      val beforeId = longValue(options["beforeId"])
      val limit = (longValue(options["limit"]) ?: 400L).toInt().coerceIn(1, 500)
      val page = readPage(emptyList(), since, until, beforeDate, beforeId, limit)
      val grouped = linkedMapOf<String, MutableMap<String, Any>>()
      for (message in page.messages) {
        val key = normalizeSender(message.sender)
        if (key.isEmpty()) continue
        val current = grouped[key]
        if (current == null) {
          grouped[key] = mutableMapOf(
            "sender" to message.sender,
            "count" to 1,
            "latestDate" to message.receivedAt,
            "preview" to redact(message.body),
            "evidence" to evidenceFor(message.sender, message.body),
          )
        } else {
          current["count"] = (current["count"] as Int) + 1
        }
      }
      mapOf(
        "examined" to page.examined,
        "senders" to grouped.values.toList(),
        "next" to page.next?.let { mapOf("date" to it.date, "id" to it.id) },
      )
    }
  }

  private data class RawMessage(val id: Long, val sender: String, val body: String, val receivedAt: Long)
  private data class Cursor(val date: Long, val id: Long)
  private data class Page(val messages: List<RawMessage>, val examined: Int, val next: Cursor?)

  private fun readPage(senders: List<String>, since: Long, until: Long, beforeDate: Long?, beforeId: Long?, limit: Int): Page {
    val context = appContext.reactContext ?: throw IllegalStateException("Android context is unavailable")
    if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
      throw SecurityException("SMS permission has not been granted")
    }
    val allowed = senders.map { normalizeSender(it) }.filter { it.isNotEmpty() }.toSet()
    val raw = readRaw(context.contentResolver, since, until, beforeDate, beforeId, limit)
    val matched = raw.rows.mapNotNull { row ->
      if (allowed.isNotEmpty() && normalizeSender(row.sender) !in allowed) return@mapNotNull null
      if (!passesFinancialGate(row.body)) return@mapNotNull null
      row
    }
    return Page(matched, raw.rows.size, raw.next)
  }

  private data class RawPage(val rows: List<RawMessage>, val next: Cursor?)

  private fun readRaw(resolver: ContentResolver, since: Long, until: Long, beforeDate: Long?, beforeId: Long?, limit: Int): RawPage {
    val selection = StringBuilder("date >= ? AND date <= ?")
    val args = mutableListOf(since.toString(), until.toString())
    if (beforeDate != null && beforeId != null) {
      selection.append(" AND (date < ? OR (date = ? AND _id < ?))")
      args.add(beforeDate.toString())
      args.add(beforeDate.toString())
      args.add(beforeId.toString())
    }
    val rows = mutableListOf<RawMessage>()
    var sqlRows = 0
    var tailDate = 0L
    var tailId = 0L
    resolver.query(
      Uri.parse("content://sms/inbox"),
      arrayOf("_id", "address", "body", "date"),
      selection.toString(),
      args.toTypedArray(),
      "date DESC, _id DESC LIMIT $limit",
    )?.use { cursor ->
      val idIndex = cursor.getColumnIndex("_id")
      val addressIndex = cursor.getColumnIndex("address")
      val bodyIndex = cursor.getColumnIndex("body")
      val dateIndex = cursor.getColumnIndex("date")
      if (addressIndex < 0 || bodyIndex < 0 || dateIndex < 0) return@use
      while (cursor.moveToNext()) {
        sqlRows += 1
        val id = if (idIndex >= 0) cursor.getLong(idIndex) else sqlRows.toLong()
        val receivedAt = cursor.getLong(dateIndex)
        tailDate = receivedAt
        tailId = id
        val sender = cursor.getString(addressIndex) ?: continue
        val body = cursor.getString(bodyIndex) ?: continue
        if (body.length > 4000) continue
        rows.add(RawMessage(id, sender, body, receivedAt))
      }
    }
    val next = if (sqlRows >= limit && sqlRows > 0) Cursor(tailDate, tailId) else null
    return RawPage(rows, next)
  }

  private fun stringList(value: Any?): List<String> {
    val raw = value as? List<*> ?: return emptyList()
    return raw.mapNotNull { it?.toString() }
  }

  private fun longValue(value: Any?): Long? = when (value) {
    is Number -> value.toLong()
    else -> null
  }

  private fun normalizeSender(value: String): String =
    value.trim().uppercase().replace(Regex("^[A-Z]{2}-"), "")

  private fun passesFinancialGate(body: String): Boolean {
    if (otp.containsMatchIn(body)) return false
    val movement = verb.containsMatchIn(body)
    if (promo.containsMatchIn(body) && !movement) return false
    if (failed.containsMatchIn(body) && !reversal.containsMatchIn(body)) return false
    return money.containsMatchIn(body) && movement
  }

  private fun evidenceFor(sender: String, body: String): List<String> {
    val hay = "${sender.lowercase()} ${body.lowercase()}"
    val tags = mutableListOf<String>()
    if (money.containsMatchIn(body)) tags.add("pkr")
    if (verb.containsMatchIn(body)) tags.add("movement")
    for ((token, id) in institutions) {
      if (hay.contains(token)) tags.add(id)
    }
    return tags
  }

  private fun redact(body: String): String {
    val hidden = body
      .replace(Regex("(?i)\\b(otp|pin|code)\\b\\s*[:#-]?\\s*[0-9]{3,8}"), "$1 ••••")
      .replace(Regex("[0-9][0-9,.]{2,}"), "••••")
      .replace(Regex("\\s+"), " ")
      .trim()
    return if (hidden.length > 90) hidden.take(87) + "..." else hidden
  }

  private val otp = Regex("(?i)\\b(otp|one[\\s-]?time(?:\\s+password)?|verification code|security code|login code|never share|do not share)\\b")
  private val promo = Regex("(?i)\\b(cashback offer|discount|coupon|apply now|limited time|shop now|sale ends|loan offer|credit card offer)\\b|\\b(sale|win|prize)\\b")
  private val failed = Regex("(?i)\\b(failed|declined|unsuccessful|could not be processed|not processed|pending|rejected|cancelled|canceled)\\b")
  private val reversal = Regex("(?i)\\b(refund(?:ed)?|reversal|reversed|reverted|returned)\\b")
  private val verb = Regex("(?i)\\b(debit(?:ed)?|credit(?:ed)?|deduct(?:ed)?|spent|paid|purchase|withdrawn|transfer(?:red)?|sent|received|deposited|charged|refund(?:ed)?|reversed|reversal)\\b")
  private val money = Regex("(?i)(\\bpkr\\b|\\brs\\.?\\b|\\brupees?\\b)")
  private val institutions = listOf(
    "habib metro" to "habibmetro",
    "standard chartered" to "scb",
    "bank alfalah" to "alfalah",
    "allied bank" to "abl",
    "bankislami" to "bankislami",
    "bank islami" to "bankislami",
    "national bank" to "nbp",
    "faysal" to "faysal",
    "askari" to "askari",
    "meezan" to "meezan",
    "jazzcash" to "jazzcash",
    "jazz cash" to "jazzcash",
    "easypaisa" to "easypaisa",
    "easy paisa" to "easypaisa",
    "sadapay" to "sadapay",
    "nayapay" to "nayapay",
    "zindigi" to "zindigi",
    "js bank" to "js",
    "bank of punjab" to "bop",
    "hbl" to "hbl",
    "ubl" to "ubl",
    "mcb" to "mcb",
    "nbp" to "nbp",
  )
}
