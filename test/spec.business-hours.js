var moment = require('../lib/business-hours');

describe('moment.business-hours', function () {

    var now = '2015-02-26T10:12:34',
        weekend = '2015-02-28T10:13:00';

    var date = 'YYYY-MM-DD',
        time = 'HH:mm:ss.SSS',
        full = date + ' ' + time;


    describe('isWorkingDay', function () {

        it('returns false on weekends by default', function () {
            moment(weekend).isWorkingDay().should.be.false;
        });

        it('returns true on weekdays by default', function () {
            moment(now).isWorkingDay().should.be.true;
        });

    });

    describe('isWorkingTime', function () {

        it('returns false on weekends by default', function () {
            moment(weekend).isWorkingTime().should.be.false;
        });

        it('returns true on weekdays by default', function () {
            moment(now).isWorkingTime().should.be.true;
        });

    });

    describe('nextWorkingDay', function () {

        it('returns the next working day', function () {
            moment(now).nextWorkingDay().format(date).should.equal('2015-02-27');
            moment(weekend).nextWorkingDay().format(date).should.equal('2015-03-02');
        });

    });

    describe('nextWorkingTime', function () {

        it('returns the start of the next working day if not a current working day', function () {
            moment(weekend).nextWorkingTime().format(full).should.equal('2015-03-02 09:00:00.000');
        });

        it('returns the start of the next working day if called after closing time on a working day', function () {
            moment('2015-02-26T17:30:00').nextWorkingTime().format(full).should.equal('2015-02-27 09:00:00.000');
        });

        it('returns the start of the working hours if called before opening time on a working day', function () {
            moment('2015-02-26T07:30:00').nextWorkingTime().format(full).should.equal('2015-02-26 09:00:00.000');
        });

        it('returns the current time and date if called during opening hours', function () {
            moment(now).nextWorkingTime().format(full).should.equal('2015-02-26 10:12:34.000');
        });

    });

    describe('addWorkingTime', function () {

        describe('adding days', function () {

            it('adds working days onto date', function () {
                moment(now).addWorkingTime(2, 'days').format(date).should.equal('2015-03-02');
                moment(now).addWorkingTime(10, 'days').format(date).should.equal('2015-03-12');
            });

            it('handles singular as well as plural units', function () {
                moment(now).addWorkingTime(1, 'day').format(date).should.equal('2015-02-27');
            });

            it('if called on a non-business day then starts from the first business day', function () {
                moment(weekend).addWorkingTime(1, 'day').format(date).should.equal('2015-03-02');
            });

        });

        describe('adding hours', function () {

            it('adds working hours onto datetime within the same working day', function () {
                moment(now).addWorkingTime(2, 'hours').format(full).should.equal('2015-02-26 12:12:34.000');
            });

            it('handles singular as well as plural units', function () {
                moment(now).addWorkingTime(1, 'hour').format(full).should.equal('2015-02-26 11:12:34.000');
            });

            it('starts from opening time of next working day if called on a non-working day', function () {
                moment(weekend).addWorkingTime(2, 'hours').format(full).should.equal('2015-03-02 11:00:00.000');
            });

            it('handles running overnight', function () {
                moment(now).addWorkingTime(9, 'hours').format(full).should.equal('2015-02-27 11:12:34.000');
            });

            it('handles running over multiple nights', function () {
                moment(now).addWorkingTime(19, 'hours').format(full).should.equal('2015-03-02 13:12:34.000');
            });

        });

        describe('adding minutes', function () {

            it('adds time simply if space within current working day', function () {
                moment(now).addWorkingTime(45, 'minutes').format(full).should.equal('2015-02-26 10:57:34.000');
            });

            it('starts from beginning of next working day if not called at an "open" time', function () {
                moment(weekend).addWorkingTime(45, 'minutes').format(full).should.equal('2015-03-02 09:45:00.000');
            });

            it('runs over to next day if insufficient space in current day', function () {
                moment('2015-02-26T16:59:59.700').addWorkingTime(45, 'minutes').format(full).should.equal('2015-02-27 09:44:59.700');
            });

            it('can support values greater than 60', function () {
                moment(now).addWorkingTime(600, 'minutes').format(full).should.equal('2015-02-27 12:12:34.000');
            });

        });

        describe('adding seconds', function () {

            it('adds time simply if space within current working day', function () {
                moment(now).addWorkingTime(45, 'seconds').format(full).should.equal('2015-02-26 10:13:19.000');
            });

            it('starts from beginning of next working day if not called at an "open" time', function () {
                moment(weekend).addWorkingTime(45, 'seconds').format(full).should.equal('2015-03-02 09:00:45.000');
            });

            it('runs over to next day if insufficient space in current day', function () {
                moment('2015-02-26T16:59:59.700').addWorkingTime(45, 'seconds').format(full).should.equal('2015-02-27 09:00:44.700');
            });

            it('can support values greater than 60', function () {
                moment(now).addWorkingTime(600, 'seconds').format(full).should.equal('2015-02-26 10:22:34.000');
            });

        });

        describe('adding milliseconds', function () {

            it('adds time simply if space within current working day', function () {
                moment(now).addWorkingTime(555, 'milliseconds').format(full).should.equal('2015-02-26 10:12:34.555');
            });

            it('starts from beginning of next working day if not called at an "open" time', function () {
                moment(weekend).addWorkingTime(555, 'milliseconds').format(full).should.equal('2015-03-02 09:00:00.555');
            });

            it('runs over to next day if insufficient space in current day', function () {
                moment('2015-02-26T16:59:59.700').addWorkingTime(555, 'milliseconds').format(full).should.equal('2015-02-27 09:00:00.255');
            });

        });

        describe('adding a combination of units', function () {
            it('can handle combinations of hours, minutes, seconds etc', function () {
                moment(now).addWorkingTime(9, 'hours', 48, 'minutes', 17, 'seconds').format(full).should.equal('2015-02-27 12:00:51.000');
            });
        });

        describe('adding an unknown unit', function () {

            it('should return self', function () {
                moment(now).addWorkingTime(3, 'epochs').format(full).should.equal('2015-02-26 10:12:34.000');
            });

        });

    });

    describe('subtractWorkingTime', function () {

        var now = '2015-02-26T16:12:34',
            weekend = '2015-03-01T16:12:34';

        describe('subtracting days', function () {

            it('takes working days off date', function () {
                moment(now).subtractWorkingTime(2, 'days').format(date).should.equal('2015-02-24');
                moment(now).subtractWorkingTime(10, 'days').format(date).should.equal('2015-02-12');
            });

            it('handles singular as well as plural units', function () {
                moment(now).subtractWorkingTime(1, 'day').format(date).should.equal('2015-02-25');
            });

            it('if called on a non-business day then starts from the first business day', function () {
                moment(weekend).subtractWorkingTime(1, 'day').format(date).should.equal('2015-02-27');
            });

        });

        describe('subtracting hours', function () {

            it('adds working hours onto datetime within the same working day', function () {
                moment(now).subtractWorkingTime(2, 'hours').format(full).should.equal('2015-02-26 14:12:34.000');
            });

            it('handles singular as well as plural units', function () {
                moment(now).subtractWorkingTime(1, 'hour').format(full).should.equal('2015-02-26 15:12:34.000');
            });

            it('starts from opening time of next working day if called on a non-working day', function () {
                moment(weekend).subtractWorkingTime(2, 'hours').format(full).should.equal('2015-02-27 15:00:00.000');
            });

            it('handles running overnight', function () {
                moment(now).subtractWorkingTime(9, 'hours').format(full).should.equal('2015-02-25 15:12:34.000');
            });

            it('handles running over multiple nights', function () {
                moment(now).subtractWorkingTime(19, 'hours').format(full).should.equal('2015-02-24 13:12:34.000');
            });

        });

        describe('subtracting minutes', function () {

            it('adds time simply if space within current working day', function () {
                moment(now).subtractWorkingTime(45, 'minutes').format(full).should.equal('2015-02-26 15:27:34.000');
            });

            it('starts from beginning of next working day if not called at an "open" time', function () {
                moment(weekend).subtractWorkingTime(45, 'minutes').format(full).should.equal('2015-02-27 16:15:00.000');
            });

            it('runs over to next day if insufficient space in current day', function () {
                moment('2015-02-26T09:00:00.700').subtractWorkingTime(45, 'minutes').format(full).should.equal('2015-02-25 16:15:00.700');
            });

        });

        describe('subtracting seconds', function () {

            it('adds time simply if space within current working day', function () {
                moment(now).subtractWorkingTime(45, 'seconds').format(full).should.equal('2015-02-26 16:11:49.000');
            });

            it('starts from beginning of next working day if not called at an "open" time', function () {
                moment(weekend).subtractWorkingTime(45, 'seconds').format(full).should.equal('2015-02-27 16:59:15.000');
            });

            it('runs over to next day if insufficient space in current day', function () {
                moment('2015-02-26T09:00:20.000').subtractWorkingTime(45, 'seconds').format(full).should.equal('2015-02-25 16:59:35.000');
            });

        });

        describe('subtracting milliseconds', function () {

            it('adds time simply if space within current working day', function () {
                moment(now).subtractWorkingTime(555, 'milliseconds').format(full).should.equal('2015-02-26 16:12:33.445');
            });

            it('starts from beginning of next working day if not called at an "open" time', function () {
                moment(weekend).subtractWorkingTime(555, 'milliseconds').format(full).should.equal('2015-02-27 16:59:59.445');
            });

            it('runs over to next day if insufficient space in current day', function () {
                moment('2015-02-26T09:00:00.100').subtractWorkingTime(555, 'milliseconds').format(full).should.equal('2015-02-25 16:59:59.545');
            });

        });

        describe('subtracting a combination of units', function () {
            it('can handle combinations of hours, minutes, seconds etc', function () {
                moment(now).subtractWorkingTime(9, 'hours', 48, 'minutes', 17, 'seconds').format(full).should.equal('2015-02-25 14:24:17.000');
            });
        });

        describe('subtracting an unknown unit', function () {

            it('should return self', function () {
                moment(now).subtractWorkingTime(3, 'epochs').format(full).should.equal('2015-02-26 16:12:34.000');
            });

        });

    });

    describe('modified locales', function () {

        beforeEach(function () {
            moment.locale('en');
        });

        afterEach(function () {
            localeData = require('../locale/default');
            moment.locale(moment.locale(), {
                workinghours: localeData.HOURS
            });
        });

        it('handles inconsistent opening hours', function () {
            moment.locale('en', {
                workinghours: {
                    0: null,
                    1: ['12:00:00', '17:00:00'],
                    2: ['09:30:00', '17:00:00'],
                    3: ['10:00:00', '17:00:00'],
                    4: ['09:00:00', '17:00:00'],
                    5: ['09:30:00', '17:00:00'],
                    6: null
                }
            });
            var mondayMorning = moment('2015-02-23T10:00:00');
            mondayMorning.isWorkingTime().should.be.false;
            mondayMorning.clone().addWorkingTime(2, 'hours').format(full).should.equal('2015-02-23 14:00:00.000');
            mondayMorning.clone().addWorkingTime(15, 'hours').format(full).should.equal('2015-02-25 12:30:00.000');
        });

        it('handles inconsistent closing hours', function () {
            moment.locale('en', {
                workinghours:  {
                    0: null,
                    1: ['09:30:00', '17:00:00'],
                    2: ['09:30:00', '17:00:00'],
                    3: ['09:30:00', '13:00:00'],
                    4: ['09:30:00', '17:00:00'],
                    5: ['09:30:00', '17:00:00'],
                    6: null
                }
            });
            var wednesdayAfternoon = moment('2015-02-25T16:00:00');
            wednesdayAfternoon.isWorkingTime().should.be.false;
            wednesdayAfternoon.clone().addWorkingTime(2, 'hours').format(full).should.equal('2015-02-26 11:30:00.000');
            wednesdayAfternoon.clone().subtractWorkingTime(8, 'hours').format(full).should.equal('2015-02-24 12:30:00.000');
        });

        it('handles different working days', function () {
            moment.locale('en', {
                workinghours: {
                    0: ['09:30:00', '17:00:00'],
                    1: ['09:30:00', '17:00:00'],
                    2: ['09:30:00', '17:00:00'],
                    3: ['09:30:00', '17:00:00'],
                    4: ['09:30:00', '17:00:00'],
                    5: null,
                    6: null
                }
            });
            var fridayAfternoon = moment('2015-02-27T16:00:00'),
                sundayMorning = moment('2015-03-01T10:00:00');
            fridayAfternoon.isWorkingTime().should.be.false;
            fridayAfternoon.isWorkingDay().should.be.false;
            sundayMorning.isWorkingTime().should.be.true;
            sundayMorning.isWorkingDay().should.be.true;
            sundayMorning.lastWorkingDay().format(date).should.equal('2015-02-26'); //thursday
        });

    });

    describe('workingDiff', function () {

        it('calculates the basic diff if the two times are on the same working day', function () {
            var from = moment('2015-02-27T10:00:00'),
                to = moment('2015-02-27T13:30:00');

            from.workingDiff(to, 'hours').should.equal(-3);
            from.workingDiff(to, 'hours', true).should.equal(-3.5);
            to.workingDiff(from, 'hours', true).should.equal(3.5);
            to.workingDiff(from, 'hours').should.equal(3);

            from.workingDiff(to, 'minutes').should.equal(-210);
            to.workingDiff(from, 'minutes').should.equal(210);
        });

        it('calculates the diff of only the working hours if two times are on different days', function () {
            var from = moment('2015-02-27T10:00:00'),
                to = moment('2015-03-02T13:30:00');

            from.workingDiff(to, 'hours').should.equal(-11);
            to.workingDiff(from, 'hours').should.equal(11);
            from.workingDiff(to, 'hours', true).should.equal(-11.5);
            to.workingDiff(from, 'hours', true).should.equal(11.5);
        });

        it('calculates the difference between dates in working days', function () {
            var from = moment('2015-02-27T10:00:00'),
                to = moment('2015-03-20T13:30:00');

            from.workingDiff(to, 'days').should.equal(16);
            to.workingDiff(from, 'days').should.equal(-16);
        });

        it('handles units that don\'t really makes sense for business opening times by deferring to moment', function () {
            var from = moment('2015-02-27'),
                to = moment('2015-05-27');

            from.workingDiff(to, 'months').should.equal(-3);
            to.workingDiff(from, 'months').should.equal(3);
        });

        it('handles inconsistent closing hours', function () {
            moment.locale('en', {
                workinghours:  {
                    0: null,
                    1: ['09:30:00', '17:00:00'],
                    2: ['09:30:00', '17:00:00'],
                    3: ['09:30:00', '13:00:00'],
                    4: ['09:30:00', '17:00:00'],
                    5: ['09:30:00', '17:00:00'],
                    6: null
                }
            });
            var from = moment('2015-02-23T10:00:00'),
                to = moment('2015-02-26T14:00:00');

            from.workingDiff(to, 'hours').should.equal(-22);
            from.workingDiff(to, 'hours', true).should.equal(-22.5);
            to.workingDiff(from, 'hours').should.equal(22);
            to.workingDiff(from, 'hours', true).should.equal(22.5);
        });

    });

});
