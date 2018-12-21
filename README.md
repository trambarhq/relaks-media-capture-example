Relaks Star Wars Example
------------------------
This is an example demonstrating how to build a data-driven web page using [Relaks](https://github.com/trambarhq/relaks). Instead of React proper, we'll be using [Preact](https://preactjs.com/). Aside from different import statements and initiation code, the example would work the same way with React. Preact was chosen because the small size and simplicity of Relaks will likely appeal most to fans of Preact.

The data source for this example is [swapi.co](https://swapi.co/), a public Star Wars knowledge base powered by [Django](https://www.djangoproject.com/). The web page shows a list of Star Wars characters. When you click on a name, it shows additional information about him/her/it. You can see it in action [here](https://trambar.io/examples/starwars-iv/).

![Screenshot](docs/img/screenshot.png)

* [Getting started](#getting-started)
* [Application](#application)
* [Character list](#character-list)
* [Character page](#character-page)
* [Next step](#next-step)

## Getting started

To see the code running in debug mode, first clone this repository. In the working folder, run `npm install`. Once that's done, run `npm run start` to launch [WebPack Dev Server](https://webpack.js.org/configuration/dev-server/). Open a browser window and enter `http://localhost:8080` as the location.

The example assume that you're familiar with React and the npm/WebPack tool-chain. If you're not, you should first consult the [React tutorial](https://reactjs.org/docs/getting-started.html). Also read [this document](docs/configuration.md) describing the example's configuration files.

## Application

Okay, let's dive into the code! In [main.js](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/main.js), you'll find the function `initialize()`. It's invoked when the HTML page emits a 'load' event. The function bootstraps the application. First it creates a `DjangoDataSource` ([django-data-source.js](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/django-data-source.js)) object. It then creates the Preact element `Application`, using the data source as a prop. Finally it renders the element into a DOM node.

```javascript
function initialize(evt) {
    let dataSource = new DjangoDataSource;
    let appContainer = document.getElementById('app-container');
    if (!appContainer) {
        throw new Error('Unable to find app element in DOM');
    }
    let appElement = h(Application, { dataSource });
    render(appElement, appContainer);
}
```

`Application` ([application.jsx](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/application.jsx)) is the root node of our app. It's a regular Preact component. Its `render()` method is relatively simple:

```javascript
render() {
    let { swapi, person } = this.state;
    if (!person) {
        let props = { swapi, onSelect: this.handlePersonSelect };
        return <CharacterList {...props} />;
    } else {
        let props = { swapi, person, onReturn: this.handlePersonUnselect };
        return <CharacterPage {...props} />;
    }
}
```

When no character is selected, it renders `CharacterList`. When one is selected, it renders `CharacterPage`. The object `swapi` is an instance of `SWAPI` ([swapi.js](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/swapi.js)) stored in `Application`'s state. It's a wrapper around the data source object. Whenever the data source emits a `change` event, `swapi` is recreated:

```javascript
handleDataSourceChange = (evt) => {
    this.setState({ swapi: new SWAPI(evt.target) });
}
```

The call to `setState()` causes the component to rerender. Because `swapi` is a new object, it would trip the change detection mechanism in `shouldComponentUpdate()` of [pure components](https://reactjs.org/docs/react-api.html#reactpurecomponent). Relaks components are pure components by default. Whenever a `change` event occurs, the `renderAsync()` method of `CharacterList` or `CharacterPage` will run.

The event handler is installed in `Application`'s `componentDidMount()` method:

```javascript
componentDidMount() {
    let { dataSource } = this.props;
    dataSource.onChange = this.handleDataSourceChange;
}
```

## Character list

`CharacterList` ([character-list.jsx](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/character-list.jsx)) is a Relaks component. It implements `renderAsync()`:

```js
async renderAsync(meanwhile) {
    let { swapi } = this.props;
    let props = {
        onSelect: this.props.onSelect,
    };
    meanwhile.show(<CharacterListSync {...props} />);
    props.people = await swapi.fetchList('/people/');
    props.people.more();
    return <CharacterListSync {...props} />;
}
```

Note the method's sole argument. The `meanwhile` object lets you control the component's behavior prior to the fulfillment of the promise returned by `renderAsync()`--i.e. while asynchronous operations are ongoing. Here, the method
asks that a `CharacterListSync` be shown (with `props.people` still undefined). It then makes a request for a list of people in the Star Wars universe and waits for the response. Execution of the method is halted at this point. When the data arrives, execution resumes. The method schedules the retrieval of the next page of data. It then return another `CharacterListSync`, this time with `props.people` set to an array of objects.

When the next page of data arrives, `DjangoDataSource` fires an `change` event. `renderAsync()` will get called again due to the prop change (namely `swapi`). `fetchList()` will return an array with more objects than before. `more()` is called and another request for data is made. The process repeats itself until we've reached the end of the list.

As the list of Star Wars characters isn't particularly long, retrieving the full list is pretty sensible. In a more sophisticated implementation, one that deals with larger data sets, `.more()` would be called in a `scroll` event handler instead.

`CharacterListSync` ([same file](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/character-list.jsx)) is a regular Preact component. It's the component that actually draws the interface, whereas the async component merely retrieves the needed data. Splitting up responsibilities in this way has some important benefits:

1. You can easily examine the retrieved data using React Developer Tools.
2. If the sync component extends `PureComponent` (not done in the example), it wouldn't rerender when the async component fetches the exact same data as before.
3. The sync component can be more easily tested using automated test tools (karma, enzyme, etc).
4. The sync component can be developed in isolation. Suppose our data retrieval code is still very buggy--or the backend isn't ready yet. A developer, whose expertise is perhaps mainly in layout and CSS, can still work on the component. All he has to do is export `CharacterListSync` as `CharacterList` and attach some dummy data as the sync component's default props.

The render method of `CharacterListSync` is entirely mundane:

```js
render() {
    let { people } = this.props;
    if (!people) {
        return <h2>Loading...</h2>;
    }
    return (
        <ul className="character-list">
        {
            people.map((person) => {
                let linkProps = {
                    href: person.url,
                    onClick: this.handleClick,
                };
                return (
                    <li>
                        <a {...linkProps}>{person.name}</a>
                    </li>
                );
            })
        }
        </ul>
    );
}
```

`meanwhile.show()` operates on a timer. The promise returned by `renderAsync()` have a 50ms to fulfill itself before the component shows the contents given to `meanwhile.show()`. When data is cached and promises resolve rapidly, the loading message would not appear at all.

## Character page

**CharacterPage** ([character-page.jsx](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/character-page.jsx)) is another Relaks component. Its `renderAsync()` method is slightly more complex:

```js
async renderAsync(meanwhile) {
    let { swapi, person, onReturn } = this.props;
    let props = {
        person,
        onReturn,
    };
    meanwhile.show(<CharacterPageSync {...props} />);
    props.films = await swapi.fetchMultiple(person.films, { minimum: '60%' });
    meanwhile.show(<CharacterPageSync {...props} />);
    props.species = await swapi.fetchMultiple(person.species, { minimum: '60%' });
    meanwhile.show(<CharacterPageSync {...props} />);
    props.homeworld = await swapi.fetchOne(person.homeworld);
    meanwhile.show(<CharacterPageSync {...props} />);
    props.vehicles = await swapi.fetchMultiple(person.vehicles, { minimum: '60%' });
    meanwhile.show(<CharacterPageSync {...props} />);
    props.starships = await swapi.fetchMultiple(person.starships, { minimum: '60%' });
    meanwhile.show(<CharacterPageSync {...props} />);
    return <CharacterPageSync {...props} />;
}
```

In succession we retrieve the `films` in which the character appeared, his `species`, his `homeworld`, the `vehicles` he has driven, and the `starships` he has piloted. We wait each time for the data to arrive, place it into `props` and call `meanwhile.show()`. In this manner the page renders progressively. For the end-user, the page will feel responsive because things appears as soon as he clicks the link.

Data requests are ordered pragmatically. We know that the film list is likely the first piece of information a visitor seeks. We also know that the list is more likely to be fully cached. That's why it's fetched first. Conversely, we know
the list of starships is at the bottom of the page, where it might not be visible initially. We can therefore fetch it last.

You will likely make similar decisions with your own app. Mouse-overs and pop-ups are frequently used to show supplemental details. These should always be fetched after the primary information. Since it takes a second or two for the user to position the mouse cursor (or his finger) over the button, there's ample time for the data to arrive.

The minimum percentage given to `fetchMultiple()` is another trick used to improve perceived responsiveness. It tells `DjangoDataSource` that we wish to receive a partial result-set immediately if 60% of the items requested can be found in the cache. That allows us to show a list that's largely complete instead of a blank. When the full result-set finally arrives, `DjangoDataSource` will emit a `change` event. Subsequent rerendering then fills in the gaps.

`CharacterPageSync` ([same file](https://github.com/trambarhq/relaks-starwars-example/blob/master/src/character-page.jsx)) is responsible for drawing the page. There's nothing noteworthy about its `render()` method. It's just run-of-the-mill React code:

```javascript
render() {
    let { person } = this.props;
    let linkProps = {
        className: 'return-link',
        href: '#',
        onClick: this.handleReturnClick,
    };
    return (
        <div className="character-page">
            <a {...linkProps}>Return to list</a>
            <h1>{person.name}</h1>
            <div>Height: {person.height} cm</div>
            <div>Mass: {person.mass} kg</div>
            <div>Hair color: {person.hair_color}</div>
            <div>Skin color: {person.skin_color}</div>
            <div>Eye color: {person.eye_color}</div>
            <div>Birth year: {person.birth_year}</div>
            <h2>Homeworld</h2>
            {this.renderHomeworld()}
            <h2>Films</h2>
            {this.renderFilms()}
            <h2>Species</h2>
            {this.renderSpecies()}
            <h2>Vehicles</h2>
            {this.renderVehicles()}
            <h2>Starships</h2>
            {this.renderStarships()}
        </div>
    );
}
```

## Next step

The application in this example is fairly crude. In the [follow up example](https://github.com/trambarhq/relaks-starwars-example-sequel), we'll develop it into something that better resembles a production web-site.
