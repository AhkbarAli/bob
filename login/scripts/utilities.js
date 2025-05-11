
/**
 *   This function is used for encrypting text using symmetric algorithm, AES/CBC/PCKS7
 */
/*function generateKey() {
	return (Math.floor((Math.random() + 1) * Math.pow(10, 15)).toString());
}*/

/**
 *   This function is used to generate random ID to be used as key, iv...
 *   @plainText - text to encrypt
 *   @key - encryption key
 */
/*function encrypt(plainText, key, iv) {

	key = key || generateKey();
	iv = iv || generateKey();

	return {
		token : CryptoJS.AES.encrypt(plainText, CryptoJS.enc.Utf8.parse(key), {
			iv : CryptoJS.enc.Utf8.parse(iv),
			mode : CryptoJS.mode.CBC,
			padding : CryptoJS.pad.Pkcs7
		}).toString(),
		key : key,
		iv : iv
	};

}*/
/**
 *   This function is used for decryption
 *   @encryptedText - text to decrypt
 *   @key - decryption key
 *   @iv - encryption iv
 */
function decrypt(encryptedText, key, iv) {

	return CryptoJS.AES.decrypt(encryptedText, CryptoJS.enc.Utf8.parse(key), {
		iv : CryptoJS.enc.Utf8.parse(iv),
		mode : CryptoJS.mode.CBC,
		padding : CryptoJS.pad.Pkcs7
	}).toString(CryptoJS.enc.Utf8);

}

/**
 *   This function is used for encrypting text using asymmetric algorithm, RSA/ECB/PCKS1
 *   @plainText - text to encrypt
 *   @key - encryption key (public)
 */
function encryptA(plainText, key) {
	var encObj = new JSEncrypt();
	encObj.setPublicKey(key);
	return encObj.encrypt(plainText);
}

/**
 *   This function is used for decryption using asymmetric algorithm
 *   @encryptedText - text to decrypt
 *   @key - decryption key (private)
 */
function decryptA(encryptedText, key) {
	var encObj = new JSEncrypt();
	encObj.setPrivateKey(key);
	return encObj.decrypt(encryptedText);
}

/**
 *   This function is used for find list of elements to be encrypted and sent to services
 */
function asyncEncryptField(){
	if(typeof vipaaPublicKey  !==  'undefined' && typeof $ !== 'undefined'){
		$('input.async-encrypt').each(function( index ) {
			var id = $(this).attr('id');
			var name = $(this).attr('name');
			var newid = id + "-val";
			$(this).removeAttr('name');
			var ipelement = '<input id="' + newid +'" name="' + name + '" type="hidden" value="">';
			$(this).after(ipelement);
			var encVal = encryptA($(this).val(),vipaaPublicKey);
			$('#'+newid).val(encVal);
			$(this).val('************************');
		});
	}
}

(function(){
	window.setTimeout( function(){
		if ( window.jQuery ){
			//console.log('Fixing dPin'); 
			jQuery('.js-card-debit input[type=password]').each(function(){
				var $e = jQuery(this);
				var dataValidation = $e.attr('data-validation');
				if ( dataValidation ){
					$e.attr('data-validation', dataValidation.replace("{3,4}","{4,12}") );
				}
			});
		}else{
			//console.log('No jQuery');
		}
	}, 1000 );
})();