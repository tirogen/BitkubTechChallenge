import Head from "next/head";
import React, { useCallback, useState } from "react";
import axios from "axios";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import CircularProgress from "@material-ui/core/CircularProgress";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import { toArray, sortBy } from "lodash";

type TX = {
  blockNumber: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol: string;
};

const ENDPOINT =
  "https://api-ropsten.etherscan.io/api?module=account&action=tokentx&startblock=0&endblock=999999999&sort=asc&apikey=YourApiKeyToken";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

type Balances = {
  [key: string]: number;
};

type Hashes = {
  [key: string]: TX;
};

type BalancesResult = {
  address: string;
  balance: number;
};

export const Home = () => {
  const [rows, setRows] = useState<TX[]>([]);
  const [currentBalances, setCurrentBalances] = useState<BalancesResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [address, setAddress] = useState("0xEcA19B1a87442b0c25801B809bf567A6ca87B1da");
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    let toDoAddress: string[] = [address];
    const hashes: Hashes = {};
    let bitkubAddress = "";
    while (toDoAddress.length > 0) {
      console.log(toDoAddress);
      let todo = toDoAddress.pop();
      let waitTime = 1300;
      let data: any = null;
      do {
        let res = await axios(`${ENDPOINT}&address=${todo}`);
        data = res.data;
        await delay(waitTime);
        waitTime = waitTime + 100;
      } while (data.status === "0");
      let results: TX[] = data.result;
      for (let result of results) {
        if (result.tokenSymbol === "BKTC" && !(result.hash in hashes)) {
          if (!bitkubAddress && result.to.toLowerCase() === address.toLowerCase()) bitkubAddress = result.from;
          hashes[result.hash] = result;
          toDoAddress.push(result.to);
        }
      }
    }

    const hashesArray = toArray(hashes);
    const hashesSort = sortBy(hashesArray, "blockNumber");
    const balances: Balances = {};
    for (let hash of hashesSort) {
      if (hash.from in balances) {
        balances[hash.from] = balances[hash.from] - Number(hash.value);
      } else {
        balances[hash.from] = -Number(hash.value);
      }
      if (hash.to in balances) {
        balances[hash.to] = balances[hash.to] + Number(hash.value);
      } else {
        balances[hash.to] = Number(hash.value);
      }
    }

    let balancesResult: BalancesResult[] = [];
    for (let address in balances) {
      if (address === bitkubAddress) continue;
      balancesResult.push({
        address,
        balance: balances[address],
      });
    }

    const hasheshResult = hashesSort.filter((hash) => hash.from !== bitkubAddress);

    setRows(hasheshResult);
    setCurrentBalances(balancesResult);
    setIsLoading(false);
  }, [address]);

  return (
    <>
      <Head>
        <title>Bitkub Tech Challenge</title>
      </Head>
      <div>
        {isLoading ? (
          <div className="flex flex-col items-center justify-items-center w-full h-full">
            <CircularProgress className="m-auto" />
          </div>
        ) : (
          <div className="p-5">
            <div className="flex space-x-2">
              <TextField
                value={address}
                fullWidth
                onChange={(e) => {
                  setAddress(e.target.value);
                }}
                label="Address"
                variant="outlined"
              />
              <Button variant="contained" color="primary" onClick={fetchData}>
                Analysis
              </Button>
            </div>
            {rows.length > 0 && (
              <TableContainer component={Paper} className="mt-5">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell align="left">TX hash</TableCell>
                      <TableCell align="left">Form (address)</TableCell>
                      <TableCell align="left">To (address)</TableCell>
                      <TableCell align="left">Amount transfer</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={row.hash}>
                        <TableCell component="th" scope="row">
                          {i + 1}
                        </TableCell>
                        <TableCell align="left">{row.hash}</TableCell>
                        <TableCell align="left">{row.from}</TableCell>
                        <TableCell align="left">{row.to}</TableCell>
                        <TableCell align="left">{Number(row.value) / 10 ** 18}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
            {currentBalances.length > 0 && (
              <TableContainer component={Paper} className="mt-5">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell align="left">Address</TableCell>
                      <TableCell align="left">Balance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentBalances.map((row, i) => (
                      <TableRow key={row.address}>
                        <TableCell component="th" scope="row">
                          {i + 1}
                        </TableCell>
                        <TableCell align="left">{row.address}</TableCell>
                        <TableCell align="left">{row.balance / 10 ** 18}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </div>
        )}
      </div>
    </>
  );
};
