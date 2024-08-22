// ts-nocheck
import { Utils } from '@shardus/types'
const fs = require('fs');
const readline = require ('readline');
const path = require('path');
const isEqual = require('fast-deep-equal');
const fss = require('fast-stable-stringify');


const func = process.argv[2];
const arg1 = process.argv[3] === undefined ? undefined : parseInt(process.argv[3]);
const arg2 = process.argv[4] === undefined ? undefined : parseInt(process.argv[4]);
//const fileName = process.argv[4] === undefined ? 'cycleRecords2.txt' : process.argv[4];

// Initialize the completeCycles array
const completeCycles = [];

// Define the path to the completeCycles.txt file
const filePath = path.join(__dirname, '..', 'instances', 'data-logs', 'cycleRecords1.txt');

// Create a readline interface
const rl = readline.createInterface({
  input: fs.createReadStream(filePath),
  output: process.stdout,
  terminal: false,
});

// Read the file line by line
rl.on('line', (line) => {
  // Parse the stringified JSON object from each line
  const { port, cycleNumber, cycleRecord } = JSON.parse(fss(JSON.parse(line)))
  //const { port, cycleNumber, cycleRecord } = JSON.parse(line)

  // Ensure the completeCycles array is large enough
  while (completeCycles.length <= cycleNumber) {
    completeCycles.push([]);
  }

  // Append the cycleRecord to the appropriate subarray
  completeCycles[cycleNumber].push({ port, cycleRecord });
});

// When file reading is complete, log the completeCycles array or perform further processing
rl.on('close', () => {
  console.log('Finished reading the file. Processing complete.');
  
  const uniqueCompleteCycles = completeCycles.map((cycleArray) => {
    const cycleMap = new Map();
    //console.log(cycleArray);
    //console.log(cycleMap);
    cycleArray.forEach(({ port, cycleRecord }) => {
      let found = false;
      for (const [key, value] of cycleMap.entries()) {
        if (isEqual(key, cycleRecord)) {
          value.push(port)
          cycleMap.set(key, value);
          found = true;
          break;
        } else {
          //console.log('Not equal:', key, cycleRecord)
        }
      }
  
      if (!found) {
        cycleMap.set(cycleRecord, [ port ]);
      }
    });
  
    return cycleMap;
  });

  // Helper functions

  function isRotationOOS(cycle) {
    if (uniqueCompleteCycles[cycle].size > 2) return false
    let loneRecordExists = false
    let nodePort
    uniqueCompleteCycles[cycle].forEach((value, key) => {
      if (value.length === 1) {
        nodePort = value[0]
        loneRecordExists = true
      }
    })
    if (loneRecordExists) {
      uniqueCompleteCycles[cycle + 1].forEach((value, key) => {
        if (value.includes(nodePort)) {
          return false
        }
      })
    }
    return true
  }

  // Analysis functions

  function printCycle(cycle) {
    console.log('Cycle', cycle);
    console.log('Unique records:', uniqueCompleteCycles[cycle].size);
    for (const [key, value] of uniqueCompleteCycles[cycle].entries()) {
      console.log(`${value.length} nodes: ${value.join(', ')} `);
      console.log(key);

  function printCycleDifferences(cycle) {
    console.log('Cycle', cycle)
    console.log('Unique records:', uniqueCompleteCycles[cycle].size)
    printCycleValueDifferences(cycle)
  }

  function printCycleValueDifferences(cycle) {
    const entries = Array.from(uniqueCompleteCycles[cycle].entries())

    console.log(`Value differences in Cycle ${cycle}:`)

    for (let i = 0; i < entries.length - 1; i++) {
      const [key1, value1] = entries[i]
      const [key2, value2] = entries[i + 1]

      console.log(`Differences between entries for nodes ${value1} and ${value2}:`)

      compareValues(key1, key2, [])
    }
  }

  function compareValues(val1, val2, path) {
    // Iterate over all properties in the first object
    for (const key in val1) {
      const newPath = [...path, key]
      if (val2.hasOwnProperty(key)) {
        if (
          typeof val1[key] === 'object' &&
          val1[key] !== null &&
          typeof val2[key] === 'object' &&
          val2[key] !== null
        ) {
          compareValues(val1[key], val2[key], newPath)
        } else if (val1[key] !== val2[key]) {
          console.log(
            `Property '${newPath.join('.')}' values differ: ${JSON.stringify(
              val1[key]
            )} is different than ${JSON.stringify(val2[key])}`
          )
        }
      } else {
        console.log(`Property '${newPath.join('.')}' not found in the second object`)
      }
    }

    // Check for any properties in the second object that are not in the first object
    for (const key in val2) {
      if (!val1.hasOwnProperty(key)) {
        console.log(`Property '${path.concat(key).join('.')}' not found in the first object`)
      }
    }
  }

  function printCycles(start = 0, end = uniqueCompleteCycles.length) {
    if (end > uniqueCompleteCycles.length) end = uniqueCompleteCycles.length;
    for (let i = start; i < end; i++) {
      printCycle(i);
    }
  }

  function printVariantCycles(start = 0, end = uniqueCompleteCycles.length) {
    if (end > uniqueCompleteCycles.length) end = uniqueCompleteCycles.length;
    for (let i = start; i < end; i++) {
      if (uniqueCompleteCycles[i].size > 1) printCycle(i);

  function printVariantCyclesDifferences(start = 0, end = uniqueCompleteCycles.length) {
    if (end > uniqueCompleteCycles.length) end = uniqueCompleteCycles.length
    for (let i = start; i < end; i++) {
      if (uniqueCompleteCycles[i].size > 1) printCycleDifferences(i)
    }
  }

  function printVariancePerCycle(start = 0, end = uniqueCompleteCycles.length) {
    if (end > uniqueCompleteCycles.length) end = uniqueCompleteCycles.length;
    for (let i = start; i < end; i++) {
      console.log(`Cycle ${i} has ${uniqueCompleteCycles[i].size} unique records`);
    }
  }

  function printVariancePerVariantCycles(start = 0, end = uniqueCompleteCycles.length) {
    if (end > uniqueCompleteCycles.length) end = uniqueCompleteCycles.length;
    for (let i = start; i < end; i++) {
      if (uniqueCompleteCycles[i].size > 1) {
        if (isRotationOOS(i) === false)
          console.log(`Cycle ${i} has ${uniqueCompleteCycles[i].size} unique records`);
      }
    }
  }

  if (func === 'help') {
    console.log('Available functions: pc, pcs, pvc, pvpc');
    console.log('pc: print cycle (args: cycle number)');
    console.log('pcs: print cycles (args: start cycle number, end cycle number)');
    console.log('pvc: print variant cycles (args: start cycle number, end cycle number)');
    console.log('pvpc: print variance per cycle (args: start cycle number, end cycle number)');
    console.log('pvpvc: print variance per variant cycles (args: start cycle number, end cycle number)');
    console.log('pvcd: print variant cycles differences (args: start cycle number, end cycle number)')
  } else if (func === 'pc') {
    printCycle(arg1);
  } else if (func === 'pcs') {
    printCycles(arg1, arg2);
  } else if (func === 'pvc') {
    printVariantCycles(arg1, arg2);
  } else if (func === 'pvpc') {
    printVariancePerCycle(arg1, arg2);
  } else if (func === 'pvpvc') {
    printVariancePerVariantCycles(arg1, arg2)
  } else if (func === 'pvcd') {
    printVariantCyclesDifferences(arg1, arg2)
  }
});
