import React from 'react';
import { Container, Typography } from '@material-ui/core';
import ParcelList from './components/parcelList';
import AdjustmentList from './components/adjustmentList';
import ImportExport from './components/importExport'
import SaleList from './components/saleList';
import DonateButton from './components/donateButton';

function App() {
    const repoUrl = 'https://github.com/judilsteve/asx-cgt-calculator-optimiser';
    return (<Container maxWidth="xl">
        <br/>
        <Typography variant="h2">ASX CGT Calculator/Optimiser</Typography>
        <br/>
        <Typography variant="h6">
            This is a simple calculator that helps with record-keeping for your ASX holdings,
            and calculation of CGT when selling.
            <br/><br/>
            All care has been taken to ensure that the calculations made here are correct and that they
            conform to ATO requirements (as at 2021-07-10). I trust this calculator enough to use it for record-keeping
            and CGT calculations of my own portfolio. However, I make no guarantee that the calculator is free from defects and accept
            no liability for any consequences incurred by you of issues herein. Always check any values calculated here against
            your own calculations.
            <br/><br/>
            If you find any issues with the calculator, please raise them <a href={`${repoUrl}/issues`}>here</a>.
            <br/><br/>
            If you find this calculator useful, and you want to show your appreciation, you can use the donation link below to shout me a coffee.
            <br/><br/>
            <DonateButton/>
            <br/>
            This calculator is a Single Page Application, or SPA. This means you can save the entire application to your computer
            right now (press Ctrl+S on your keyboard) so that you still have access too the calculator even if this website
            disappears from the internet.
            <br/><br/>
            This calculator is also free software licensed under the <a href={`${repoUrl}/blob/master/COPYING.md`}>Affero GPL</a>. You may view the source code <a href={repoUrl}>here</a>.
            If you wish to use the source code as a basis for your own work, you may do so, but you must
            adhere to the terms of the original license if you distribute your work.
            <br/><br/>
            Portfolio data is auto-saved to your browser's local storage: Your data does not leave your computer.
            It is highly recommended that you export a backup of your portfolio data using the buttons below so that your
            records are not lost if uninstall your browser, clear the local storage, lose your laptop, etc.
        </Typography>
        <br/>
        <ImportExport/>
        <br/><br/>
        <Typography variant="h3">Parcels</Typography>
        <br/>
        <Typography variant="h6">
            Enter details of all holdings (past and present) below, including dividend reinvestments.
        </Typography>
        <br/>
        <ParcelList/>
        <br/><br/>
        <Typography variant="h3">Cost Base Adjustments</Typography>
        <br/>
        <Typography variant="h6">
            Enter details of all cost base adjustments below (e.g. AMIT net adjustments from your annual tax statements).
        </Typography>
        <br/>
        <AdjustmentList/>
        <br/><br/>
        <Typography variant="h3">Sales</Typography>
        <br/>
        <Typography variant="h6">
            Enter details of all sale events below.
        </Typography>
        <br/>
        <SaleList/>
        <div style={{ height: '75vh' }}/>{/* Bit of dead space to let the user scroll content up higher for convenience */}
    </Container>);
}

export default App;
