import React from 'react';

export default function DonateButton() {
    return <form action="https://www.paypal.com/donate" method="post" target="_top">
        <input type="hidden" name="business" value="VT6UPHJXTK3N2" />
        <input type="hidden" name="no_recurring" value="1" />
        <input type="hidden" name="item_name" value="CGT Calculator Thankyou" />
        <input type="hidden" name="currency_code" value="AUD" />
        <input type="image" src="https://www.paypalobjects.com/en_AU/i/btn/btn_donate_LG.gif" border="0" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
        <img alt="" border="0" src="https://www.paypal.com/en_AU/i/scr/pixel.gif" width="1" height="1" />
    </form>;
}