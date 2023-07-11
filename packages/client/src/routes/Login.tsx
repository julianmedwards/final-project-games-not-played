// React
import {
    Link,
    useNavigate,
    useRevalidator,
    useRouteLoaderData,
} from 'react-router-dom'
// Types
import { RootLoaderData } from '../routes/Root'
import { useState } from 'react'

function Login() {
    const rootLoaderData = useRouteLoaderData('root') as RootLoaderData
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [message, setMessage] = useState<null | string>(null)

    const navigate = useNavigate()
    const revalidator = useRevalidator()

    async function handleLogin(e: React.BaseSyntheticEvent) {
        e.preventDefault()

        const response = await fetch(
            `${import.meta.env.VITE_API_URL}/login/password`,
            {
                method: 'POST',
                headers: {
                    content: 'application/x-www-form-urlencoded',
                    'x-csrf-token':
                        typeof rootLoaderData.csrf.token === 'string'
                            ? rootLoaderData.csrf.token
                            : '',
                },
                body: new URLSearchParams({
                    username: username,
                    password: password,
                }),
            }
        )

        if (response.ok) {
            revalidator.revalidate()
            // React Router will pause the revalidation to happen after
            // navigation.
            navigate('/', { replace: true })
        } else if (response.status === 401 || response.status === 403) {
            setMessage('Incorrect username or password.')
            setUsername('')
            setPassword('')
        } else {
            throw new Error('Unexpected error logging in.')
        }
    }

    return (
        <>
            <section className="prompt">
                <h3>Sample App</h3>
                <h1>Sign in</h1>
                {message && (
                    <section className="messages">
                        <p>{message}</p>
                    </section>
                )}
                <form onSubmit={(e) => handleLogin(e)}>
                    <section>
                        <label htmlFor="username">Username</label>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            id="username"
                            name="username"
                            type="text"
                            autoComplete="username"
                            required
                            autoFocus
                        />
                    </section>
                    <section>
                        <label htmlFor="current-password">Password</label>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            id="current-password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                        />
                    </section>
                    <button type="submit">Sign in</button>
                </form>
                <hr />
                <p className="help">
                    Don't have an account? <Link to={'/signup'}>Sign up</Link>
                </p>
            </section>
        </>
    )
}

export default Login
