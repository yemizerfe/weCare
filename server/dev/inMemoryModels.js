'use strict';

/**
 * A small, dependency-free, Mongoose-compatible in-memory store.
 *
 * It exists so the app can run and be tested without a MongoDB server
 * (`USE_IN_MEMORY_DB=true`). It implements only the query surface used by
 * server.js: create, find, findOne, findById, exists, updateOne, updateMany,
 * deleteOne, deleteMany, findOneAndUpdate and findOneAndDelete, plus the
 * chainable select/sort/limit/lean helpers. Data is ephemeral and must never
 * be used in production.
 */

const crypto = require('crypto');

const collections = new Map();

function collection(name) {
    if (!collections.has(name)) collections.set(name, new Map());
    return collections.get(name);
}

function newId() {
    return crypto.randomBytes(12).toString('hex');
}

function getPath(doc, path) {
    return path.split('.').reduce((value, key) => (value == null ? undefined : value[key]), doc);
}

function setPath(doc, path, value) {
    const keys = path.split('.');
    let target = doc;
    for (let index = 0; index < keys.length - 1; index += 1) {
        if (typeof target[keys[index]] !== 'object' || target[keys[index]] === null) {
            target[keys[index]] = {};
        }
        target = target[keys[index]];
    }
    target[keys[keys.length - 1]] = value;
}

function unsetPath(doc, path) {
    const keys = path.split('.');
    let target = doc;
    for (let index = 0; index < keys.length - 1; index += 1) {
        target = target?.[keys[index]];
        if (!target) return;
    }
    delete target[keys[keys.length - 1]];
}

function normalize(value) {
    if (value === null || value === undefined) return value;
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'object' && value._bsontype === 'ObjectId') return String(value);
    return value;
}

function equals(left, right) {
    const a = normalize(left);
    const b = normalize(right);
    if (a instanceof Date || b instanceof Date) {
        return new Date(a).getTime() === new Date(b).getTime();
    }
    if (a && b && typeof a === 'object' && typeof b === 'object') {
        return JSON.stringify(a) === JSON.stringify(b);
    }
    return String(a) === String(b);
}

function compare(left, right) {
    const a = normalize(left);
    const b = normalize(right);
    if (typeof a === 'number' || typeof b === 'number') return Number(a) - Number(b);
    if (a instanceof Date || b instanceof Date) return new Date(a).getTime() - new Date(b).getTime();
    return String(a).localeCompare(String(b));
}

function matches(doc, filter = {}) {
    return Object.entries(filter).every(([path, expected]) => {
        const actual = getPath(doc, path);

        if (expected instanceof RegExp) return expected.test(String(actual ?? ''));

        if (expected && typeof expected === 'object' && !Array.isArray(expected) && !(expected instanceof Date)) {
            const operators = Object.keys(expected);
            if (operators.some((operator) => operator.startsWith('$'))) {
                return operators.every((operator) => {
                    const operand = expected[operator];
                    switch (operator) {
                        case '$lt': return actual !== undefined && compare(actual, operand) < 0;
                        case '$lte': return actual !== undefined && compare(actual, operand) <= 0;
                        case '$gt': return actual !== undefined && compare(actual, operand) > 0;
                        case '$gte': return actual !== undefined && compare(actual, operand) >= 0;
                        case '$in': return (operand || []).some((value) => equals(actual, value));
                        case '$nin': return !(operand || []).some((value) => equals(actual, value));
                        case '$ne': return !equals(actual, operand);
                        case '$exists': return (actual !== undefined) === Boolean(operand);
                        case '$regex': return new RegExp(operand, expected.$options || '').test(String(actual ?? ''));
                        default: throw new Error(`Unsupported in-memory query operator ${operator}`);
                    }
                });
            }
        }

        return equals(actual, expected);
    });
}

function applyUpdate(doc, update = {}) {
    const hasOperators = Object.keys(update).some((key) => key.startsWith('$'));

    if (!hasOperators) {
        Object.entries(update).forEach(([path, value]) => setPath(doc, path, value));
    } else {
        Object.entries(update.$set || {}).forEach(([path, value]) => setPath(doc, path, value));
        Object.keys(update.$unset || {}).forEach((path) => unsetPath(doc, path));
    }

    doc.updatedAt = new Date();
    return doc;
}

function project(doc, projection) {
    if (!projection) return doc;
    const fields = String(projection).split(/\s+/).filter(Boolean);
    const excluding = fields.some((field) => field.startsWith('-'));
    if (excluding) {
        const copy = { ...doc };
        fields.filter((field) => field.startsWith('-')).forEach((field) => delete copy[field.slice(1)]);
        return copy;
    }
    const copy = { _id: doc._id };
    fields.forEach((field) => {
        const value = getPath(doc, field);
        if (value !== undefined) setPath(copy, field, value);
    });
    return copy;
}

class Query {
    constructor(model, filter, single = false) {
        this.model = model;
        this.filter = filter;
        this.single = single;
        this.options = { projection: null, sort: null, limit: null };
    }

    select(projection) {
        this.options.projection = projection;
        return this;
    }

    sort(spec) {
        this.options.sort = spec;
        return this;
    }

    limit(count) {
        this.options.limit = count;
        return this;
    }

    populate() {
        return this;
    }

    lean() {
        return this;
    }

    then(onFulfilled, onRejected) {
        return this.exec().then(onFulfilled, onRejected);
    }

    async exec() {
        const { projection, sort, limit } = this.options;
        let results = [...this.model.docs.values()].filter((doc) => matches(doc, this.filter));

        if (sort) {
            const entries = Object.entries(sort);
            results = results.sort((left, right) => {
                for (const [field, direction] of entries) {
                    const order = compare(getPath(left, field), getPath(right, field));
                    if (order !== 0) return direction < 0 ? -order : order;
                }
                return 0;
            });
        }

        if (limit) results = results.slice(0, limit);

        const shaped = results.map((doc) => project(doc, projection));
        return this.single ? shaped[0] || null : shaped;
    }
}

function createModel(collectionName, defaults = {}) {
    const model = {
        collectionName,
        docs: collection(collectionName),

        async create(input = {}) {
            const now = new Date();
            const id = input._id ? String(input._id) : newId();
            const doc = {
                ...defaults,
                ...input,
                _id: id,
                createdAt: input.createdAt || now,
                updatedAt: input.updatedAt || now,
            };
            model.docs.set(id, doc);
            return doc;
        },

        find(filter = {}) {
            return new Query(model, filter, false);
        },

        findOne(filter = {}) {
            return new Query(model, filter, true);
        },

        findById(id) {
            return new Query(model, { _id: id }, true);
        },

        async exists(filter = {}) {
            return [...model.docs.values()].some((doc) => matches(doc, filter));
        },

        async countDocuments(filter = {}) {
            return [...model.docs.values()].filter((doc) => matches(doc, filter)).length;
        },

        async updateOne(filter, update, options = {}) {
            const doc = [...model.docs.values()].find((entry) => matches(entry, filter));
            if (!doc) {
                if (!options.upsert) return { matchedCount: 0, modifiedCount: 0, upsertedCount: 0 };
                const base = Object.fromEntries(
                    Object.entries(filter).filter(([, value]) => value === null || typeof value !== 'object'),
                );
                await model.create({ ...base, ...(update.$set || {}) });
                return { matchedCount: 0, modifiedCount: 0, upsertedCount: 1 };
            }
            applyUpdate(doc, update);
            return { matchedCount: 1, modifiedCount: 1, upsertedCount: 0 };
        },

        async updateMany(filter, update) {
            const docs = [...model.docs.values()].filter((entry) => matches(entry, filter));
            docs.forEach((doc) => applyUpdate(doc, update));
            return { matchedCount: docs.length, modifiedCount: docs.length };
        },

        async deleteOne(filter) {
            const doc = [...model.docs.values()].find((entry) => matches(entry, filter));
            if (!doc) return { deletedCount: 0 };
            model.docs.delete(doc._id);
            return { deletedCount: 1 };
        },

        async deleteMany(filter) {
            const docs = [...model.docs.values()].filter((entry) => matches(entry, filter));
            docs.forEach((doc) => model.docs.delete(doc._id));
            return { deletedCount: docs.length };
        },

        async findOneAndUpdate(filter, update, options = {}) {
            let doc = [...model.docs.values()].find((entry) => matches(entry, filter));
            if (!doc) {
                if (!options.upsert) return null;
                const base = Object.fromEntries(
                    Object.entries(filter).filter(([, value]) => value === null || typeof value !== 'object'),
                );
                doc = await model.create({ ...base, ...(update.$set || {}) });
                return doc;
            }
            applyUpdate(doc, update);
            return doc;
        },

        async findOneAndDelete(filter) {
            const doc = [...model.docs.values()].find((entry) => matches(entry, filter));
            if (!doc) return null;
            model.docs.delete(doc._id);
            return doc;
        },
    };

    return model;
}

const Users = createModel('users', { locationSharing: false, linkedCaregiverId: null });
const Reminder = createModel('reminders');
const Album = createModel('albums');
const Task = createModel('tasks');
const CareNote = createModel('carenotes');
const CheckIn = createModel('checkins');

function resetStore() {
    collections.forEach((docs) => docs.clear());
}

module.exports = { Users, Reminder, Album, Task, CareNote, CheckIn, resetStore };
