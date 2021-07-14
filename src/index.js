import React from 'react';
import ReactDOM from 'react-dom';
import App from './App.jsx';
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DayjsUtils from '@date-io/dayjs';

ReactDOM.render(
  <React.StrictMode>
    <MuiPickersUtilsProvider utils={DayjsUtils}>
      <App />
    </MuiPickersUtilsProvider>
  </React.StrictMode>,
  document.getElementById('root')
);
