
const express = require('express');
const braintree = require("braintree");
const router = express.Router();

const gateway = new braintree.BraintreeGateway({
    environment: braintree.Environment.Sandbox,
    merchantId: "s389ynq32hn9bvs4",
    publicKey: "w4t9ntjxzh23d2ph",
    privateKey: "2d0e4a122904126718b531092cee0043"
});

let idForConfirmation;
let paymentResultForConfirmation;
let chargeAmount;

//http://localhost/api/v1/token GET
router.get('/token', (req, res) => {

    gateway.clientToken.generate({})
        .then(response => {
            if (response.success) { res.json({ token: response.clientToken }); }
        }).catch(err => {
            res.json(err);
        });
})

//http://localhost/api/v1/checkout
router.post('/checkout', (req, res) => {

    chargeAmount = req.body.chargeAmount
    const nonceFromTheClient = req.body.nonce;
    
    const customer = {
        firstName: req.body.firstName,
        lastName: req.body.lastName
    }
    gateway.customer.create(customer, (err, customerResult) => {
        if (customerResult.success) {

            gateway.paymentMethod.create({
                customerId: customerResult.customer.id,
                paymentMethodNonce: nonceFromTheClient.nonce,
                options: {
                    usBankAccountVerificationMethod: braintree.UsBankAccountVerification.VerificationMethod.MicroTransfers
                }
            }, (err, paymentResult) => {

                if (paymentResult.success) {
                    paymentResultForConfirmation = paymentResult
                    const usBankAccount = paymentResult.paymentMethod;
                    const verificationId = usBankAccount.verifications[0].id;
                    idForConfirmation = verificationId

                    res.json({ status: "success" })
                }
            });

        }
    });
})


//http://localhost/api/v1/checkout POST
router.post('/confirmation', (req, res) => {
  
    const confirmationId1 = parseInt(req.body.firstAmount);
    const confirmationId2 = parseInt(req.body.secondAmount)

    gateway.usBankAccountVerification.confirmMicroTransferAmounts(idForConfirmation, [confirmationId1, confirmationId2],
        (err, response) => {
            if (response.success) {
                gateway.usBankAccountVerification.find(response.usBankAccountVerification.id, (err, verification) => {
                    const status = verification.status;
                    if (status == 'verified') {
                        gateway.transaction.sale({
                            amount: chargeAmount,
                            paymentMethodToken: paymentResultForConfirmation.usBankAccount.token,
                            //deviceData: nonceFromTheClient.deviceData,
                            options: {
                                submitForSettlement: true
                            }
                        }, (err, result) => {
                            if (result.success) {
                                res.json({
                                    status: "success",
                                    transaction: result.transaction
                                });
                            } else {
                                res.json({ status: "fail" })
                            }
                        });

                    } else if (status == 'pending') {
                        res.json({ status: "pending" })
                    } else {
                        res.json({ status: "fail" })
                    }
                });
            } else {
                res.json({ status: "fail" })
            }
        });

})

//http://localhost/api/v1/notification POST
router.post('/notification', (req, res) => {

   const sampleNotification = gateway.webhookTesting.sampleNotification(
        braintree.WebhookNotification.Kind.SubscriptionWentPastDue,
        "myId"
      );
      gateway.webhookNotification.parse(
        sampleNotification.bt_signature,
        sampleNotification.bt_payload,
          (err, webhookNotification) => {
              console.log(webhookNotification);
              res.json({ status: webhookNotification.subscription });
          webhookNotification.subscription.id
          // "myId"
        }
      );
})
  
module.exports = router;