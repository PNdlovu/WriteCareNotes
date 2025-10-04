import { Link } from 'react-router-dom'
import { Code, Book, Download, ExternalLink } from 'lucide-react'
import { Button } from '../../components/ui/Button'

export function APIDocumentationPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gray-800 w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-6">
            <Code className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            API Documentation
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Integrate WriteCareNotes with your existing systems using our comprehensive REST API
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="#getting-started">
                Get Started
              </Link>
            </Button>
            <Button variant="outline" size="lg">
              <Download className="mr-2 h-5 w-5" />
              Download SDK
            </Button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <nav className="sticky top-8">
                <h3 className="font-semibold text-gray-900 mb-4">Navigation</h3>
                <ul className="space-y-2 text-sm">
                  <li><a href="#getting-started" className="text-primary hover:text-primary/80">Getting Started</a></li>
                  <li><a href="#authentication" className="text-gray-600 hover:text-primary">Authentication</a></li>
                  <li><a href="#endpoints" className="text-gray-600 hover:text-primary">API Endpoints</a></li>
                  <li><a href="#examples" className="text-gray-600 hover:text-primary">Code Examples</a></li>
                  <li><a href="#webhooks" className="text-gray-600 hover:text-primary">Webhooks</a></li>
                  <li><a href="#support" className="text-gray-600 hover:text-primary">Support</a></li>
                </ul>
              </nav>
            </div>
            
            <div className="lg:col-span-3">
              <div className="prose prose-lg max-w-none">
                <section id="getting-started" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h2>
                  <p className="text-gray-600 mb-6">
                    The WriteCareNotes API allows you to integrate our care management platform with your existing systems. 
                    Our RESTful API provides access to resident data, care plans, staff information, and compliance reports.
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <h4 className="font-semibold text-gray-900 mb-2">Base URL</h4>
                    <code className="bg-gray-800 text-white px-3 py-1 rounded text-sm">
                      https://api.writecarenotes.com/v1
                    </code>
                  </div>
                </section>

                <section id="authentication" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication</h2>
                  <p className="text-gray-600 mb-6">
                    All API requests require authentication using API keys. You can generate API keys from your 
                    WriteCareNotes dashboard under Settings → API Keys.
                  </p>
                  
                  <div className="bg-gray-900 rounded-lg p-6 mb-6">
                    <pre className="text-white text-sm overflow-x-auto">
{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
     -H "Content-Type: application/json" \\
     https://api.writecarenotes.com/v1/residents`}
                    </pre>
                  </div>
                </section>

                <section id="endpoints" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">API Endpoints</h2>
                  
                  <div className="space-y-6">
                    {[
                      {
                        method: 'GET',
                        endpoint: '/residents',
                        description: 'Retrieve a list of all residents'
                      },
                      {
                        method: 'POST',
                        endpoint: '/residents',
                        description: 'Create a new resident record'
                      },
                      {
                        method: 'GET',
                        endpoint: '/staff',
                        description: 'Retrieve staff information and schedules'
                      },
                      {
                        method: 'GET',
                        endpoint: '/care-plans/{id}',
                        description: 'Get detailed care plan information'
                      },
                      {
                        method: 'POST',
                        endpoint: '/incidents',
                        description: 'Report a new incident'
                      }
                    ].map((endpoint, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold mr-3 ${
                            endpoint.method === 'GET' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {endpoint.method}
                          </span>
                          <code className="text-gray-800 font-mono">{endpoint.endpoint}</code>
                        </div>
                        <p className="text-gray-600 text-sm">{endpoint.description}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section id="examples" className="mb-12">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Code Examples</h2>
                  
                  <div className="bg-gray-900 rounded-lg p-6">
                    <h4 className="text-white font-semibold mb-4">JavaScript Example</h4>
                    <pre className="text-white text-sm overflow-x-auto">
{`const response = await fetch('https://api.writecarenotes.com/v1/residents', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const residents = await response.json();
console.log(residents);`}
                    </pre>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Need Help with Integration?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Our technical team is here to help you integrate WriteCareNotes with your systems
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/contact">
                Contact Technical Support
                <ExternalLink className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/help">
                Visit Help Center
                <Book className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}