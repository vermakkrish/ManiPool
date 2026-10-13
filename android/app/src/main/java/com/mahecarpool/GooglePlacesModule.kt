package com.mahecarpool

import android.app.AlertDialog
import android.text.Html
import android.text.method.LinkMovementMethod
import android.widget.TextView

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.ViewManager
import com.google.android.libraries.places.api.Places
import com.google.android.libraries.places.api.model.AutocompleteSessionToken
import com.google.android.libraries.places.api.model.Place
import com.google.android.libraries.places.api.net.FetchPlaceRequest
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsRequest

class GooglePlacesModule(context: ReactApplicationContext) : ReactContextBaseJavaModule(context) {
  private var session: AutocompleteSessionToken? = null
  override fun getName() = "ManiPoolPlaces"
  override fun getConstants(): Map<String, Any> = mapOf(
    "mapsEnabled" to BuildConfig.GOOGLE_MAPS_ENABLED,
    "placesEnabled" to BuildConfig.GOOGLE_PLACES_API_KEY.isNotBlank()
  )

  private fun client() = run {
    check(BuildConfig.GOOGLE_PLACES_API_KEY.isNotBlank()) { "Google Places key is not configured." }
    if (!Places.isInitialized()) {
      Places.initializeWithNewPlacesApiEnabled(reactApplicationContext, BuildConfig.GOOGLE_PLACES_API_KEY)
    }
    Places.createClient(reactApplicationContext)
  }

  @ReactMethod
  fun endSession() { session = null }

  @ReactMethod
  fun showAttributions(html: String) {
    UiThreadUtil.runOnUiThread {
      reactApplicationContext.currentActivity?.let { activity ->
        val text = TextView(activity).apply {
          setPadding(32, 32, 32, 32)
          setText(Html.fromHtml(html, Html.FROM_HTML_MODE_LEGACY))
          movementMethod = LinkMovementMethod.getInstance()
        }
        AlertDialog.Builder(activity).setTitle("Google Maps data providers")
          .setView(text).setPositiveButton("Close", null).show()
      }
    }
  }

  @ReactMethod
  fun search(query: String, promise: Promise) {
    try {
      if (query.trim().length < 2) { promise.resolve(Arguments.createArray()); return }
      val token = session ?: AutocompleteSessionToken.newInstance().also { session = it }
      val request = FindAutocompletePredictionsRequest.builder()
        .setQuery(query.trim()).setCountries("IN").setSessionToken(token).build()
      client().findAutocompletePredictions(request)
        .addOnSuccessListener { response ->
          val items = Arguments.createArray()
          response.autocompletePredictions.take(5).forEach { prediction ->
            items.pushMap(Arguments.createMap().apply {
              putString("placeId", prediction.placeId)
              putString("name", prediction.getPrimaryText(null).toString())
              putString("address", prediction.getSecondaryText(null).toString())
            })
          }
          promise.resolve(items)
        }.addOnFailureListener { promise.reject("PLACES_SEARCH", "Place search failed. Check internet, billing and key restrictions.", it) }
    } catch (error: Exception) { promise.reject("PLACES_SETUP", "Google Places is unavailable. Check Android key setup.", error) }
  }

  @ReactMethod
  fun details(placeId: String, promise: Promise) {
    try {
      val fields = listOf(Place.Field.ID, Place.Field.DISPLAY_NAME, Place.Field.FORMATTED_ADDRESS, Place.Field.LOCATION)
      val token = session
      val request = FetchPlaceRequest.builder(placeId, fields).setSessionToken(token).build()
      client().fetchPlace(request)
        .addOnSuccessListener { response ->
          if (session === token) { session = null }
          val place = response.place
          val point = place.location
          if (point == null) { promise.reject("PLACE_LOCATION", "This place has no selectable coordinates."); return@addOnSuccessListener }
          promise.resolve(Arguments.createMap().apply {
            putString("placeId", place.id ?: placeId)
            putString("name", place.displayName ?: "Selected place")
            putString("address", place.formattedAddress ?: "Google place")
            putDouble("latitude", point.latitude)
            putDouble("longitude", point.longitude)
            putArray("attributions", Arguments.createArray().apply {
              place.attributions?.forEach { pushString(it) }
            })
          })
        }.addOnFailureListener { if (session === token) { session = null }; promise.reject("PLACE_DETAILS", "Could not load this place. Try again.", it) }
    } catch (error: Exception) { session = null; promise.reject("PLACES_SETUP", "Google Places is unavailable. Check Android key setup.", error) }
  }
}

class GooglePlacesPackage : ReactPackage {
  override fun createNativeModules(context: ReactApplicationContext): List<NativeModule> = listOf(GooglePlacesModule(context))
  override fun createViewManagers(context: ReactApplicationContext): List<ViewManager<*, *>> = emptyList()
}
