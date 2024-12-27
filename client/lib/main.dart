import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Flutter Book List Demo',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: BookListScreen(),
    );
  }
}

class Book {
  final int id;
  final String title;
  final String author;
  final String genre;
  final int publishedYear;

  Book({
    required this.id,
    required this.title,
    required this.author,
    required this.genre,
    required this.publishedYear,
  });

  factory Book.fromJson(Map<String, dynamic> json) {
    return Book(
      id: json['id'],
      title: json['title'],
      author: json['author'],
      genre: json['genre'],
      publishedYear: json['published_year'],
    );
  }
}

class BookListScreen extends StatefulWidget {
  @override
  _BookListScreenState createState() => _BookListScreenState();
}

class _BookListScreenState extends State<BookListScreen> {
  List<Book> _books = [];
  int _currentPage = 1;
  bool _hasNextPage = true;
  bool _isLoading = false;
  String _serverUrl = 'http://toktoktalk.com:30101';

  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _fetchBooks();
    _scrollController.addListener(_onScroll);
  }

  Future<void> _fetchBooks() async {
    if (_isLoading) return;
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await http.get(
        Uri.parse('$_serverUrl/api/books?page=$_currentPage&limit=10')
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> booksJson = data['books'];
        setState(() {
          _books.addAll(booksJson.map((json) => Book.fromJson(json)).toList());
          _currentPage++;
          _hasNextPage = _currentPage <= data['totalPages'];
          _isLoading = false;
        });
      } else {
        throw Exception('Failed to load books');
      }
    } catch (e) {
      print('Error fetching books: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _onScroll() {
    if (_scrollController.position.pixels == _scrollController.position.maxScrollExtent) {
      if (_hasNextPage) {
        _fetchBooks();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Book List')),
      body: ListView.builder(
        controller: _scrollController,
        itemCount: _books.length + (_hasNextPage ? 1 : 0),
        itemBuilder: (context, index) {
          if (index < _books.length) {
            final book = _books[index];
            return ListTile(
              title: Text(book.title),
              subtitle: Text('${book.author} - ${book.publishedYear}'),
              trailing: Text(book.genre),
            );
          } else {
            return Center(child: CircularProgressIndicator());
          }
        },
      ),
    );
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }
}
