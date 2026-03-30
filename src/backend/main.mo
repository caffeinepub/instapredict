import AccessControl "./authorization/access-control";
import MixinAuthorization "./authorization/MixinAuthorization";
import OutCall "./http-outcalls/outcall";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import List "mo:core/List";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";

persistent actor {
  // Authorization state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Legacy Stripe config - kept for upgrade compatibility only (no longer used)
  let stripeConfig = { secretKey = ""; allowedCountries = [] : [Text] };

  // Prediction record
  public type Prediction = {
    id : Text;
    hashtags : [Text];
    contentType : Text;
    timeOfUpload : Text;
    followerCount : Nat;
    predictedLikes : Nat;
    timestamp : Int;
    paid : Bool;
  };

  // Per-user history
  var predictions = List.empty<(Principal, Prediction)>();

  // Razorpay config
  let razorpayKeyId = "rzp_test_SXNTwwkvN5SoSo";
  let razorpayBasicAuth = "cnpwX3Rlc3RfU1hOVHd3a3ZONVNvU286SHg5TDNzVzVScnJVdVhrRzRaRWF5N21H";

  // HTTP transform for outcalls
  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    { input.response with headers = [] };
  };

  // Save a prediction (unpaid)
  public shared ({ caller }) func savePrediction(
    id : Text,
    hashtags : [Text],
    contentType : Text,
    timeOfUpload : Text,
    followerCount : Nat,
    predictedLikes : Nat
  ) : async () {
    let pred : Prediction = {
      id;
      hashtags;
      contentType;
      timeOfUpload;
      followerCount;
      predictedLikes;
      timestamp = Time.now();
      paid = false;
    };
    predictions.add((caller, pred));
  };

  // Mark prediction as paid
  public shared ({ caller }) func markPredictionPaid(predId : Text) : async Bool {
    var found = false;
    let updated = List.empty<(Principal, Prediction)>();
    for ((p, pred) in predictions.values()) {
      if (Principal.equal(p, caller) and pred.id == predId) {
        updated.add((p, { pred with paid = true }));
        found := true;
      } else {
        updated.add((p, pred));
      };
    };
    predictions := updated;
    found;
  };

  // Get prediction history for caller
  public query ({ caller }) func getPredictionHistory() : async [Prediction] {
    let result = List.empty<Prediction>();
    for ((p, pred) in predictions.values()) {
      if (Principal.equal(p, caller)) {
        result.add(pred);
      };
    };
    result.toArray();
  };

  // Create Razorpay order for ₹99 (9900 paise)
  public shared ({ caller }) func createRazorpayOrder(predId : Text) : async Text {
    let receipt = caller.toText() # "-" # predId;
    let body = "amount=9900&currency=INR&receipt=" # receipt;
    let headers = [
      { name = "authorization"; value = "Basic " # razorpayBasicAuth },
      { name = "content-type"; value = "application/x-www-form-urlencoded" },
    ];
    try {
      await OutCall.httpPostRequest(
        "https://api.razorpay.com/v1/orders",
        headers,
        body,
        transform
      );
    } catch (err) {
      Runtime.trap("Razorpay order creation failed: " # err.message());
    };
  };

  // Verify Razorpay payment and mark prediction as paid
  public shared ({ caller }) func verifyRazorpayPayment(paymentId : Text, predId : Text) : async Bool {
    let headers = [
      { name = "authorization"; value = "Basic " # razorpayBasicAuth },
    ];
    try {
      let response = await OutCall.httpGetRequest(
        "https://api.razorpay.com/v1/payments/" # paymentId,
        headers,
        transform
      );
      if (response.contains(#text "\"captured\"") or response.contains(#text "\"authorized\"")) {
        ignore await markPredictionPaid(predId);
        true;
      } else {
        false;
      };
    } catch (_) {
      false;
    };
  };

  // Get Razorpay key ID for frontend
  public query func getRazorpayKeyId() : async Text {
    razorpayKeyId;
  };
};
