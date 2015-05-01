var moment = require('moment'),
    minimatch = require('minimatch');

var localeData = require('../locale/default');
moment.locale(moment.locale(), localeData);

function getLocaleData(key) {
    return moment.localeData()['_' + key];
}

function openingTimes(d) {
    d = d.clone();
    var hours = getLocaleData('workinghours');
    if (!d.isWorkingDay()) {
        return null;
    }
    return hours[d.day()].map(function (time) {
        time = time.split(':');
        var _d = d.clone();
        _d.hours(time[0]);
        _d.minutes(time[1] || 0);
        _d.seconds(time[2] || 0);
        _d.milliseconds(0);
        return _d;
    });
}

function incrementDays(fn) {
    return function (n, d) {
        while (n) {
            d[fn](1, 'day');
            if (d.isWorkingDay()) {
                n--;
            }
        }
        return d;
    };
}

function addUnit(unit) {
    return function (n, d) {
        if (!d.isWorkingTime()) {
            d = d.nextWorkingTime();
        }
        while (n > 0) {
            var then = d.clone().add(n, unit);
            if (then.isWorkingTime()) {
                d = d.add(n, unit);
                n = 0;
            } else {
                var next = then.nextWorkingTime();
                var diff = then.diff(openingTimes(d)[1], unit, true);
                d = next;
                n = diff;
            }
        }
        return d;
    };
}

function subtractUnit(unit) {
    return function (n, d) {
        if (!d.isWorkingTime()) {
            d = d.lastWorkingTime();
        }
        while (n > 0) {
            var then = d.clone().subtract(n, unit);
            if (then.isWorkingTime()) {
                d = d.subtract(n, unit);
                n = 0;
            } else {
                var next = then.lastWorkingTime();
                var diff = then.diff(openingTimes(d)[0], unit, true);
                d = next;
                n = -diff;
            }
        }
        return d;
    };
}

function copy(from, to) {
    ['year', 'month', 'date', 'hour', 'minute', 'second', 'millisecond'].forEach(function (unit) {
        to.set(unit, from.get(unit));
    });
    return to;
}

function add(d, num, unit) {
    unit = moment.normalizeUnits(unit);
    if (unit === 'day') {
        d = incrementDays('add')(num, d);
    } else if (unit) {
        d = addUnit(unit)(num, d);
    }
    return d;
}

function subtract(d, num, unit) {
    unit = moment.normalizeUnits(unit);
    if (unit === 'day') {
        d = incrementDays('subtract')(num, d);
    } else if (unit) {
        d = subtractUnit(unit)(num, d);
    }
    return d;
}

function addOrSubtractMethod(fn) {
    return function (num, unit) {
        if (typeof unit !== 'string') {
            throw new Error('unit must be defined');
        }
        if (typeof num !== 'number') {
            throw new Error('duration must be defined');
        }
        var args = [].slice.call(arguments);
        if (args.length % 2) {
            throw new Error('moment#(add/subtract)WorkingTime requires an even number of arguments');
        }

        var d = this;

        while (args.length >= 2) {
            d = fn.bind(null, d).apply(null, args.slice(-2));
            args = args.slice(0, -2);
        }

        return copy(d, this);
    };
}

moment.fn.addWorkingTime = addOrSubtractMethod(add);
moment.fn.subtractWorkingTime = addOrSubtractMethod(subtract);

moment.fn.isBusinessDay = function isBusinessDay() {
    var hours = getLocaleData('workinghours');
    return !!hours[this.day()] && !this.isHoliday();
};
moment.fn.isWorkingDay = moment.fn.isBusinessDay;

moment.fn.isWorkingTime = function isWorkingTime() {
    var openinghours = openingTimes(this);
    if (!openinghours) {
        return false;
    } else {
        return this.isAfter(openinghours[0]) && this.isBefore(openinghours[1]);
    }
};

moment.fn.isHoliday = function isHoliday() {
    var isHoliday = false,
        today = this.format('YYYY-MM-DD');
    getLocaleData('holidays').forEach(function (holiday) {
        if (minimatch(today, holiday)) {
            isHoliday = true;
        }
    });
    return isHoliday;
};

moment.fn.nextWorkingDay = function nextWorkingDay() {
    var d = this.clone();
    d = d.add(1, 'day');
    while (!d.isWorkingDay()) {
        d = d.add(1, 'day');
    }
    return d;
};

moment.fn.lastWorkingDay = function nextWorkingDay() {
    var d = this.clone();
    d = d.subtract(1, 'day');
    while (!d.isWorkingDay()) {
        d = d.subtract(1, 'day');
    }
    return d;
};

moment.fn.nextWorkingTime = function nextWorkingTime() {
    if (this.isWorkingDay()) {
        var openinghours = openingTimes(this);
        if (this.isBefore(openinghours[0])) {
            return openinghours[0];
        } else if (this.isAfter(openinghours[1])) {
            return openingTimes(this.nextWorkingDay())[0];
        } else {
            return this.clone();
        }
    } else {
        return openingTimes(this.nextWorkingDay())[0];
    }
};

moment.fn.lastWorkingTime = function nextWorkingTime() {
    if (this.isWorkingDay()) {
        var openinghours = openingTimes(this);
        if (this.isAfter(openinghours[1])) {
            return openinghours[1];
        } else if (this.isBefore(openinghours[0])) {
            return openingTimes(this.lastWorkingDay())[1];
        } else {
            return this.clone();
        }
    } else {
        return openingTimes(this.lastWorkingDay())[1];
    }
};

moment.fn.workingDiff = function workingDiff(comparator, unit, detail) {
    unit = unit || 'milliseconds';
    unit = moment.normalizeUnits(unit);

    comparator = moment(comparator);

    if (['year', 'month', 'week'].indexOf(unit) > -1) {
        return this.diff(comparator, unit, detail);
    }

    var from, to, diff = 0, multiplier = 1;
    if (this.isAfter(comparator)) {
        to = this.clone();
        from = comparator.clone();
        multiplier = -1;
    } else {
        to = comparator.clone();
        from = this.clone();
    }

    if (!from.isWorkingTime()) {
        from = from.nextWorkingTime();
    }
    if (!to.isWorkingTime()) {
        to = to.lastWorkingTime();
    }

    while(from.format('L') !== to.format('L')) {
        if (unit === 'day') {
            diff++;
        } else {
            diff += from.diff(openingTimes(from)[1], unit, true);
        }
        from = openingTimes(from.nextWorkingDay())[0];
    }

    if (unit === 'day') {
        diff++;
    } else {
        diff += from.diff(to, unit, true);
    }

    if(!detail) {
        diff = diff < 0 ? Math.ceil(diff) : Math.floor(diff);
    }

    return multiplier * diff;

};


module.exports = moment;
