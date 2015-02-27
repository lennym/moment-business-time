# moment-business-time

Query and manipulate moment objects within the scope of business/working hours.

## Install

```
npm install [--save] moment-business-time
```

## Methods


### `moment#isWorkingDay`

Returns: Boolean
Determines if the day of the current instance is a working day. Working days are defined as any day with working hours in the current locale.

#### Example:
```javascript
moment('2015-02-27').isWorkingDay();
// true
moment('2015-02-28').isWorkingDay();
// false
```

### `moment#isWorkingTime`

Returns: Boolean
Determines if the day and time of the current instance corresponds to during business hours as defined by the currnet locale.

#### Example:
```javascript
moment('2015-02-27T15:00:00').isWorkingTime();
// true
moment('2015-02-27T20:00:00').isWorkingTime();
// false
```

### `moment#nextWorkingDay`

Returns: moment
Returns a new moment representing the next day considered to be a working day. The hours/minutes/seconds will be as for the source moment.

#### Example:
```javascript
moment('2015-02-28T10:00:00Z').nextWorkingDay();
// Mon Mar 02 2015 10:00:00 GMT+0000
moment('2015-02-28T20:00:00Z').nextWorkingDay();
// Mon Mar 02 2015 20:00:00 GMT+0000
```

### `moment#nextWorkingTime`

Returns: moment
Returns a new moment representing the start of the next day considered to be a working day.

#### Example:
```javascript
moment('2015-02-28T10:00:00Z').nextWorkingTime();
// Mon Mar 02 2015 09:00:00 GMT+0000
moment('2015-02-28T20:00:00Z').nextWorkingTime();
// Mon Mar 02 2015 09:00:00 GMT+0000
```

### `moment#lastWorkingDay`

Returns: moment
Returns a new moment representing the previous day considered to be a working day. The hours/minutes/seconds will be as for the source moment.

#### Example:
```javascript
moment('2015-02-28T10:00:00Z').lastWorkingDay();
// Fri Feb 27 2015 10:00:00 GMT+0000
moment('2015-02-28T20:00:00Z').lastWorkingDay();
// Fri Feb 27 2015 20:00:00 GMT+0000
```

### `moment#lastWorkingTime`

Returns: moment
Returns a new moment representing the end of the previous day considered to be a working day.

#### Example:
```javascript
moment('2015-02-28T10:00:00Z').lastWorkingTime();
// Fri Feb 27 2015 17:00:00 GMT+0000
moment('2015-02-28T20:00:00Z').lastWorkingTime();
// Fri Feb 27 2015 17:00:00 GMT+0000
```

### `moment#addWorkingTime`

Returns: self
Adds an amount of working time to a moment, modifying the original moment instance.

#### Example:
```javascript
moment('2015-02-27T10:00:00Z').addWorkingTime(5, 'hours');
// Fri Feb 27 2015 15:00:00 GMT+0000
moment('2015-02-28T10:00:00Z').addWorkingTime(5, 'hours');
// Mon Mar 02 2015 14:00:00 GMT+0000
moment('2015-02-27T10:00:00Z').addWorkingTime(5, 'hours', 30, 'minutes');
// Fri Feb 27 2015 15:30:00 GMT+0000

```

### `moment#subtractWorkingTime`

Returns: self
Adds an amount of working time to a moment, modifying the original moment instance.

#### Example:
```javascript
moment('2015-02-27T16:00:00Z').subtractWorkingTime(5, 'hours');
// Fri Feb 27 2015 11:00:00 GMT+0000
moment('2015-02-28T16:00:00Z').subtractWorkingTime(5, 'hours');
// Fri Feb 27 2015 12:00:00 GMT+0000
moment('2015-02-27T16:00:00Z').subtractWorkingTime(5, 'hours', 30, 'minutes');
// Fri Feb 27 2015 10:30:00 GMT+0000

```

## Running tests

```
npm test
```
