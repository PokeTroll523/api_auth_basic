import db from '../dist/db/models/index.js';
import bcrypt from 'bcrypt';

const createUser = async (req) => {
    const {
        name,
        email,
        password,
        password_second,
        cellphone
    } = req.body;
    if (password !== password_second) {
        return {
            code: 400,
            message: 'Passwords do not match'
        };
    }
    const user = await db.User.findOne({
        where: {
            email: email
        }
    });
    if (user) {
        return {
            code: 400,
            message: 'User already exists'
        };
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.User.create({
        name,
        email,
        password: encryptedPassword,
        cellphone,
        status: true
    });
    return {
        code: 200,
        message: 'User created successfully with ID: ' + newUser.id,
    }
};

const getUserById = async (id) => {
    return {
        code: 200,
        message: await db.User.findOne({
            where: {
                id: id,
                status: true,
            }
        })
    };
}

const updateUser = async (req) => {
    const user = db.User.findOne({
        where: {
            id: req.params.id,
            status: true,
        }
    });
    const payload = {};
    payload.name = req.body.name ?? user.name;
    payload.password = req.body.password ? await bcrypt.hash(req.body.password, 10) : user.password;
    payload.cellphone = req.body.cellphone ?? user.cellphone;
    await db.User.update(payload, {
        where: {
            id: req.params.id
        }

    });
    return {
        code: 200,
        message: 'User updated successfully'
    };
}

const deleteUser = async (id) => {
    await db.User.update({
        status: false
    }, {
        where: {
            id: id
        }
    });
    return {
        code: 200,
        message: 'User deleted successfully'
    };
}



const getAllUsers = async () => {
    const users = await db.User.findAll({
        where: {
            status: true
        }
    });
    return {
        code: 200,
        message: users
    };
}

const findUsers = async (query) => {
    const whereClause = {};

    if (query.eliminated !== undefined) {
        whereClause.status = query.eliminated === 'false';
    }

    if (query.name) {
        whereClause.name = {
            [db.Sequelize.Op.like]: `%${query.name}%`
        };
    }

    if (query.loggedInBefore) {
        whereClause.lastLogin = {
            [db.Sequelize.Op.lt]: new Date(query.loggedInBefore)
        };
    }

    if (query.loggedInAfter) {
        whereClause.lastLogin = {
            [db.Sequelize.Op.gt]: new Date(query.loggedInAfter)
        };
    }

    const users = await db.User.findAll({
        where: whereClause
    });

    return {
        code: 200,
        message: users
    };
}

const bulkCreateUsers = async (users) => {
    let successCount = 0;
    let failureCount = 0;

    for (const user of users) {
        const { name, email, password, password_second, cellphone } = user;
        if (password !== password_second) {
            failureCount++;
            continue;
        }

        const existingUser = await db.User.findOne({
            where: {
                email: email
            }
        });

        if (existingUser) {
            failureCount++;
            continue;
        }

        const encryptedPassword = await bcrypt.hash(password, 10);

        await db.User.create({
            name,
            email,
            password: encryptedPassword,
            cellphone,
            status: true
        });

        successCount++;
    }

    return {
        code: 200,
        message: `Successfully created ${successCount} users, failed to create ${failureCount} users`
    };
}


export default {
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    getAllUsers,
    findUsers,
    bulkCreateUsers,
}